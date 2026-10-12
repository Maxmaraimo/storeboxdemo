"""
StoreBox Sidekick Voice Service — Microsoft Azure Cognitive Services Speech REST API.
Generates natural neural speech (`uz-UZ-MadinaNeural`, `ru-RU-DmitryNeural`, `en-US-BrianMultilingualNeural`)
and returns a Base64-encoded MP3 stream in <0.5s.
"""
import os
import re
import base64
import hashlib
import logging
import threading
from xml.sax.saxutils import escape as xml_escape
from typing import Optional, Dict, Any, Tuple

import requests
import urllib3
from django.conf import settings
from django.core.cache import cache

import socket
import urllib3.util.connection

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# Force IPv4 to prevent 5-7s IPv6 connection timeout fallback on local ISP networks
urllib3.util.connection.allowed_gai_family = lambda: socket.AF_INET
logger = logging.getLogger(__name__)

# Persistent HTTP session with connection pooling to eastus.tts.speech.microsoft.com
_AZURE_TTS_SESSION = requests.Session()
_AZURE_TTS_SESSION.trust_env = False
_adapter = requests.adapters.HTTPAdapter(pool_connections=4, pool_maxsize=8, max_retries=1)
_AZURE_TTS_SESSION.mount("https://", _adapter)

AZURE_VOICE_MAP: Dict[str, Tuple[str, str]] = {
    "uz": ("uz-UZ", "uz-UZ-MadinaNeural"),
    "ru": ("ru-RU", "ru-RU-DmitryNeural"),
    "en": ("en-US", "en-US-BrianMultilingualNeural"),
}


def detect_tts_language(text: str, language: str = "auto") -> str:
    """
    Automatically determines the language ('uz', 'ru', 'en') from the text or passed flag.
    """
    t = (text or "").strip()
    t_low = t.lower()
    lang_norm = (language or "auto").strip().lower()

    # 1. Check for Uzbek Cyrillic characters or words
    if re.search(r"[ўқғҳЎҚҒҲ]", t) or re.search(
        r"\b(ассалом|ассалому|алайкум|салом|менга|махсулот|буюртма|курсат|тушум|мижоз|яхши|рахмат)\b",
        t_low,
    ):
        return "uz"

    # 2. Check for Russian Cyrillic characters
    if re.search(r"[а-яА-ЯёЁ]", t):
        return "ru"

    # 3. Check for Uzbek Latin words, suffixes, or apostrophes
    if (
        re.search(
            r"\b(assalom|assalomu|alaykum|salom|marhamat|albatta|hozir|uchun|bilan|buyurtma|buyurtmalar|"
            r"mahsulot|mahsulotlar|maxsulot|so'm|som|do'kon|dokon|qanday|qancha|bo'lim|bolim|sahifa|"
            r"ko'rsat|korsat|ochyapman|tahlil|tovar|mijoz|bugun|bugungi|hafta|oylik|tushum|yordam|kerak|"
            r"tayyor|jami|o'rtacha|narx|chegirma|katalog|rahmat)\b",
            t_low,
        )
        or re.search(r"[oOgG]['‘’ʻʼ]", t)
        or re.search(r"(larni|lardan|larga|ning|dagi|yapman|moqda|miz|siz)\b", t_low)
    ):
        return "uz"

    # 4. If explicitly passed language flag matches script
    if lang_norm.startswith("uz"):
        return "uz"
    if lang_norm.startswith("en"):
        return "en"
    if lang_norm.startswith("ru"):
        return "ru"

    if re.search(r"[a-zA-Z]", t):
        return "en"

    return "ru"


def clean_text_for_tts(text: str, lang: str = "ru") -> str:
    """Strips markdown symbols, emojis, URLs, and normalizes brand phonetics for fast Azure Neural TTS."""
    if not text:
        return ""

    clean = text
    clean = re.sub(
        r"[\U0001F300-\U0001F9FF\u2600-\u26FF\u2700-\u27BF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF]+",
        "",
        clean,
    )
    clean = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", clean)
    clean = re.sub(r"https?://\S+", "", clean)
    # Preserve apostrophe (') for Uzbek o', g', so'm, bo'lim!
    clean = re.sub(r'[*#`_~«»"]', "", clean)
    clean = re.sub(r"^[•\-\*]\s+", "", clean, flags=re.MULTILINE)

    if lang == "uz":
        clean = re.sub(r"Burger\s*&\s*Co\.?", "Burger end Ko", clean, flags=re.IGNORECASE)
        clean = re.sub(r"&\s*Co\.?", "end Ko", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\s*&\s*", " va ", clean)
        clean = re.sub(r"\bUZS\b", "so'm", clean, flags=re.IGNORECASE)
    elif lang == "en":
        clean = re.sub(r"Burger\s*&\s*Co\.?", "Burger and Company", clean, flags=re.IGNORECASE)
        clean = re.sub(r"&\s*Co\.?", "and Company", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\s*&\s*", " and ", clean)
    else:
        clean = re.sub(r"Burger\s*&\s*Co\.?", "Бургер энд Ко", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\bBurger\b", "Бургер", clean, flags=re.IGNORECASE)
        clean = re.sub(r"&\s*Co\.?", "энд Ко", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\bStoreBox\b", "СторБокс", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\bSidekick\b", "Сайдкик", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\s*&\s*", " и ", clean)
        clean = re.sub(r"\bUZS\b", "сум", clean, flags=re.IGNORECASE)

    clean = re.sub(r"\s+", " ", clean).strip()

    # Keep spoken output crisp and fast to synthesize (up to ~260 chars / 2 sentences)
    if len(clean) > 260:
        cut = clean[:260]
        last_punct = max(cut.rfind("."), cut.rfind("!"), cut.rfind("?"))
        if last_punct > 60:
            clean = cut[: last_punct + 1]
        else:
            clean = cut.rsplit(" ", 1)[0] + "."
    return clean


def synthesize_voice(text: str, language: str = "auto") -> Optional[str]:
    """
    Synthesizes neural speech via Microsoft Azure Cognitive Services Speech REST API:
      POST https://{region}.tts.speech.microsoft.com/cognitiveservices/v1
    Voices:
      - Uzbek (uz): uz-UZ-MadinaNeural
      - Russian (ru): ru-RU-DmitryNeural
      - English (en): en-US-BrianMultilingualNeural
    Returns Base64-encoded MP3 audio string.
    """
    detected_lang = detect_tts_language(text, language=language)
    clean_text = clean_text_for_tts(text, lang=detected_lang)
    if not clean_text:
        return None

    # Check fast in-memory TTS cache first (instant 0ms hit for repeated phrases)
    cache_key = "az_tts_v2_" + hashlib.md5(f"{detected_lang}:{clean_text}".encode("utf-8")).hexdigest()
    cached_audio = cache.get(cache_key)
    if cached_audio:
        return cached_audio

    azure_key = (
        getattr(settings, "AZURE_SPEECH_KEY", "")
        or os.environ.get("AZURE_SPEECH_KEY", "")
    ).strip().strip('"').strip("'")
    azure_region = (
        getattr(settings, "AZURE_SPEECH_REGION", "eastus")
        or os.environ.get("AZURE_SPEECH_REGION", "eastus")
        or "eastus"
    ).strip().strip('"').strip("'")

    if not azure_key:
        logger.error("AZURE_SPEECH_KEY is missing in settings/.env.")
        return None

    lang_code, voice_name = AZURE_VOICE_MAP.get(detected_lang, AZURE_VOICE_MAP["ru"])
    escaped_text = xml_escape(clean_text)

    url = f"https://{azure_region}.tts.speech.microsoft.com/cognitiveservices/v1"
    headers = {
        "Ocp-Apim-Subscription-Key": azure_key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
        "User-Agent": "StoreBoxSidekick",
        "Connection": "keep-alive",
    }
    ssml_body = (
        f"<speak version='1.0' xml:lang='{lang_code}'>"
        f"<voice xml:lang='{lang_code}' name='{voice_name}'>"
        f"<prosody rate='+6%'>{escaped_text}</prosody>"
        f"</voice>"
        f"</speak>"
    )

    try:
        response = _AZURE_TTS_SESSION.post(
            url,
            headers=headers,
            data=ssml_body.encode("utf-8"),
            timeout=4.5,
            verify=False,
        )
        if response.status_code == 200 and response.content:
            b64 = base64.b64encode(response.content).decode("utf-8")
            cache.set(cache_key, b64, timeout=3600)
            return b64

        logger.error(
            "Azure Speech TTS error (%s): %s",
            response.status_code,
            response.text[:300],
        )
        return None
    except Exception as exc:
        logger.error("Azure Speech TTS request exception: %s", exc)
        return None


def _warmup_azure_connection():
    """Pre-warms the TLS socket to Azure TTS in background so the first user request has 0ms TLS handshake."""
    try:
        azure_region = (
            getattr(settings, "AZURE_SPEECH_REGION", "")
            or os.environ.get("AZURE_SPEECH_REGION", "eastus")
        ).strip() or "eastus"
        _AZURE_TTS_SESSION.get(
            f"https://{azure_region}.tts.speech.microsoft.com/cognitiveservices/v1",
            timeout=3.0,
            verify=False,
        )
    except Exception:
        pass


threading.Thread(target=_warmup_azure_connection, daemon=True).start()


def generate_voice_response(text: str, language: str = "auto") -> Optional[str]:
    """Alias for synthesize_voice."""
    return synthesize_voice(text=text, language=language)


def generate_voice_payload(text: str, language: str = "auto") -> Dict[str, Any]:
    """Returns voice payload dict with Base64 MP3 audio and browser TTS disabled."""
    audio_b64 = synthesize_voice(text=text, language=language)
    return {
        "audio_base64": audio_b64,
        "use_browser_tts": False,
    }
