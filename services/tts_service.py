"""
StoreBox Sidekick Voice Service — ElevenLabs API (`eleven_multilingual_v2`).
Generates high-quality neural speech via ElevenLabs with low-latency connection pooling
and returns a Base64 MP3 stream.
"""
import re
import base64
import logging
from typing import Optional, Dict, Any

import requests
import urllib3
from django.conf import settings

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

# Persistent HTTP session to reuse TLS connection to api.elevenlabs.io (saves ~500ms per call)
_TTS_SESSION = requests.Session()
_TTS_SESSION.trust_env = False


def clean_text_for_tts(text: str) -> str:
    """Strips markdown symbols, emojis, and URLs so ElevenLabs reads clean natural sentences fast."""
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
    clean = re.sub(r"[*#`_~]", "", clean)
    clean = re.sub(r"^[•\-\*]\s+", "", clean, flags=re.MULTILINE)
    clean = re.sub(r"\bUZS\b", "сум", clean, flags=re.IGNORECASE)
    clean = re.sub(r"\s+", " ", clean).strip()

    # Keep spoken output natural and concise (up to ~380 chars) so TTS finishes in <0.7s
    if len(clean) > 380:
        cut = clean[:380]
        last_punct = max(cut.rfind("."), cut.rfind("!"), cut.rfind("?"))
        if last_punct > 120:
            clean = cut[: last_punct + 1]
        else:
            clean = cut.rsplit(" ", 1)[0] + "."
    return clean


def generate_voice_response(text: str, voice_id: Optional[str] = None) -> Optional[str]:
    """
    Sends text to ElevenLabs API:
      POST https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}
    Headers:
      {"xi-api-key": settings.ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    Model:
      eleven_multilingual_v2
    Returns Base64-encoded MP3 audio string.
    """
    clean_text = clean_text_for_tts(text)
    if not clean_text:
        return None

    api_key = getattr(settings, "ELEVENLABS_API_KEY", "").strip()
    target_voice_id = (voice_id or getattr(settings, "ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")).strip()

    if not api_key or not target_voice_id:
        logger.error("ElevenLabs API key or Voice ID missing in settings.")
        return None

    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{target_voice_id}"
        f"?optimize_streaming_latency=3&output_format=mp3_22050_32"
    )
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": clean_text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.78,
        },
    }

    try:
        response = _TTS_SESSION.post(url, headers=headers, json=payload, timeout=10.0, verify=False)
        if response.status_code == 200 and response.content:
            return base64.b64encode(response.content).decode("utf-8")

        logger.error(
            "ElevenLabs API error (%s): %s",
            response.status_code,
            response.text[:300],
        )
        return None
    except Exception as exc:
        logger.error("ElevenLabs TTS request exception: %s", exc)
        return None


def generate_voice_payload(text: str, voice_id: Optional[str] = None) -> Dict[str, Any]:
    audio_b64 = generate_voice_response(text, voice_id=voice_id)
    return {
        "audio_base64": audio_b64,
        "use_browser_tts": False,
    }
