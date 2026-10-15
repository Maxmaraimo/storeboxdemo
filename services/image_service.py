import os
import re
import socket
import random
import urllib.parse
import urllib3.util.connection
import requests

# Force IPv4 to prevent 5-10s IPv6 timeouts on local connections
urllib3.util.connection.allowed_gai_family = lambda: socket.AF_INET

try:
    from django.conf import settings
    _api_key_from_settings = getattr(settings, 'POLLINATIONS_API_KEY', None) if settings.configured else None
    _groq_key_from_settings = getattr(settings, 'GROQ_API_KEY', None) if settings.configured else None
except Exception:
    _api_key_from_settings = None
    _groq_key_from_settings = None


def clean_and_translate_to_english(raw_prompt: str) -> str:
    """
    Cleans conversational filler words ('сделай фото', 'нарисуй', etc.)
    and ensures the prompt is in clean English so that FLUX generates the exact requested subject
    instead of defaulting to random commercial bottle templates.
    """
    text = (raw_prompt or "").strip()
    if not text:
        return "minimalist product on white background"

    # Remove common Russian / Uzbek / English command prefixes
    text = re.sub(
        r"^(пожалуйста\s*|илтимос\s*)?(сделай\s*(мне\s*)?фото(графию)?|сгенерируй\s*(изображение|картинку|фото)?|"
        r"нарисуй\s*(мне)?|создай\s*(изображение|картинку|фото)?|покажи\s*фото|хочу\s*(фото|картинку)|"
        r"rasm\s*chiz|rasmini\s*(ol|korsat|ko'rsat)|foto\s*(yarat|qil)|"
        r"make\s*a\s*photo\s*of|generate\s*(an?\s*)?(image|photo)\s*(of)?|draw\s*(an?\s*)?|create\s*(an?\s*)?(image|photo)\s*(of)?)\s*",
        "",
        text,
        flags=re.IGNORECASE
    ).strip()

    # If the text has no Cyrillic characters, it's already in English (or Latin)
    if not re.search(r"[а-яА-ЯёЁўқғҳЎҚҒҲ]", text):
        return text

    # Fast online translation via Groq Qwen (takes ~0.2-0.3s)
    groq_key = _groq_key_from_settings or os.environ.get("GROQ_API_KEY", "")
    if groq_key:
        try:
            r = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}"},
                json={
                    "model": "qwen/qwen3.8-27b",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a prompt translator for the Flux image generation model. "
                                "Convert the user's item/scene request into a concise, high-quality visual prompt in English. "
                                "Return ONLY the English visual description (no markdown, no quotes, no conversational filler)."
                            ),
                        },
                        {"role": "user", "content": text},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 50,
                },
                timeout=2.5,
            )
            if r.status_code == 200:
                translated = r.json()["choices"][0]["message"]["content"].strip("\"' .")
                if translated and not re.search(r"[а-яА-ЯёЁ]", translated):
                    return translated
        except Exception:
            pass

    # Instant offline fallback dictionary for common ecommerce & test terms
    fallback_map = {
        "рубашк": "classic white button-down cotton shirt hanging on wall",
        "пингвин": "cute emperor penguin standing on ice in antarctica",
        "кроссовк": "luxury black designer sneakers on white background",
        "обув": "luxury designer shoes on white background",
        "туфл": "elegant black patent stiletto high heels on white background",
        "сумк": "luxury leather handbag on white background",
        "плать": "elegant white evening maxi dress",
        "куртк": "black bomber streetwear jacket",
        "худ": "oversized black streetwear hoodie",
        "кепк": "vintage washed cotton baseball cap",
        "шляп": "wide brim fedora hat",
        "дух": "luxury perfume glass bottle with golden cap",
        "лосьон": "luxury fragrance body lotion bottle",
        "кофт": "red polka dot silk blouse",
        "брюк": "wide-leg baggy denim jeans",
        "джинс": "vintage blue denim jeans",
        "реме": "black leather belt with gold buckle",
        "клатч": "evening sparkling crystal clutch",
        "час": "luxury gold wristwatch",
        "машин": "modern red sports car",
        "кошк": "cute fluffy kitten",
        "собак": "cute golden retriever puppy",
    }
    low = text.lower()
    for key_pattern, translation in fallback_map.items():
        if key_pattern in low:
            return translation

    return text


def generate_flux_image(prompt: str, width: int = 1024, height: int = 1024) -> str:
    # 1. Автоматически переводим в понятный для FLUX английский промпт и убираем команды
    clean_en_prompt = clean_and_translate_to_english(prompt)

    # 2. Определяем категорию: товар каталога vs живое существо / пейзаж
    product_keywords = (
        r"\b(shirt|t-shirt|shoes|sneakers|boots|heels|bag|handbag|tote|dress|jacket|hoodie|"
        r"coat|pants|jeans|cap|hat|belt|clutch|watch|perfume|bottle|lotion|cream|jewelry|"
        r"ring|glasses|box|card|pack|cosmetic|wallet|product)\b"
    )
    if re.search(product_keywords, clean_en_prompt, re.I):
        quality_suffix = "commercial 8k product photography, professional studio lighting, hyperrealistic, high details"
    else:
        quality_suffix = "high quality professional photography, professional lighting, hyperrealistic, 8k, sharp focus"

    commercial_prompt = f"{clean_en_prompt}, {quality_suffix}"
    encoded_prompt = urllib.parse.quote(commercial_prompt)
    seed = random.randint(1, 999999)

    api_key = _api_key_from_settings or os.environ.get('POLLINATIONS_API_KEY', 'sk_YCfYsnTkM1HHC5hUR222zY78u2RyExm1')

    # Эндпоинт Pollinations с передачей авторизационного токена
    return f"https://gen.pollinations.ai/image/{encoded_prompt}?width={width}&height={height}&model=flux&nologo=true&seed={seed}&key={api_key}"
