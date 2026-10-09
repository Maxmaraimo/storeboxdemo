"""
StoreBox AI Studio - Apple Silicon M2 Neural Diffusion Engine.
Provides high-fidelity, photorealistic e-commerce product imagery using:
1. Local SD-Turbo Commercial Diffusion Pipeline on Apple Silicon MPS (`torch.device("mps")`)
2. Text-to-Image & Image-to-Image / Inpaint pipelines with sub-2-second generation speed
3. Resilient fallback to Apple Silicon Studio Compositor if GPU memory is constrained
"""

import os
import io
import re
import time
import uuid
import logging
from PIL import Image, ImageOps, ImageFilter
from django.conf import settings

logger = logging.getLogger(__name__)

_DEVICE = None
_DIFFUSERS_T2I = None
_DIFFUSERS_I2I = None

# Multilingual Commercial Photography Keyword Mappings (RU, UZ, EN)
SUBJECT_RULES = [
    (r"(?:рубашк|сорочк|ko'?ylak|shirt)", "crisp white cotton button-down dress shirt, neatly folded with spread collar"),
    (r"(?:бургер|чизбургер|burger)", "gourmet juicy artisan burger with melted cheddar cheese, fresh crisp lettuce, sesame bun"),
    (r"(?:худи|толстовк|свитшот|hoodie)", "black oversized streetwear cotton hoodie, clean minimalist aesthetic"),
    (r"(?:футболк|futbolka|t-?shirt|tee)", "minimalist premium cotton t-shirt, neatly folded"),
    (r"(?:айфон|телефон|смартфон|iphone|phone|telefon)", "sleek modern flagship smartphone with edge-to-edge glass screen, titanium frame"),
    (r"(?:наушник|airpods|headphone|quloqchin)", "matte wireless over-ear premium headphones with metal headband"),
    (r"(?:час|хронограф|watch|soat)", "luxury chronograph wristwatch with stainless steel bezel and leather strap"),
    (r"(?:ноутбук|макбук|laptop|macbook)", "sleek minimalist aluminum laptop open on clean surface"),
    (r"(?:пицц|pizza)", "freshly baked artisan Italian pizza with bubbling mozzarella cheese and fresh basil"),
    (r"(?:кофе|капучино|латте|coffee|qahva)", "hot artisan cappuccino with creamy latte art in ceramic cup"),
    (r"(?:кроссовк|кед|sneakers?|shoes?|krossovka|poyabzal)", "modern athletic sneakers floating in clean dynamic profile view"),
    (r"(?:брюк|джинс|штаны|pants|jeans|shim)", "classic tailored dark denim jeans, neatly styled"),
    (r"(?:куртк|пальто|бомбер|jacket|kurtka)", "stylish tailored streetwear jacket"),
    (r"(?:парфюм|дух[ие]|аромат|perfume|atir)", "luxury glass perfume bottle with gold cap, soft reflections"),
    (r"(?:цвет[ыо]|розы|букет|flowers?|gul)", "fresh elegant bouquet of flowers in a modern glass vase"),
    (r"(?:сумк|рюкзак|bag|backpack|sumka)", "minimalist handcrafted leather bag"),
    (r"(?:очк[ио]|sunglasses|ko'zoynak)", "designer black polarized sunglasses on sleek surface"),
]

COLOR_RULES = [
    (r"(?:бел\w*|white|oq)", "white"),
    (r"(?:черн\w*|black|qora)", "black"),
    (r"(?:красн\w*|red|qizil)", "vibrant red"),
    (r"(?:син\w*|голуб\w*|blue|ko'?k)", "deep navy blue"),
    (r"(?:зелен\w*|green|yashil)", "emerald green"),
    (r"(?:желт\w*|yellow|sariq)", "bright yellow"),
    (r"(?:сер\w*|grey|gray|kulrang)", "charcoal grey"),
    (r"(?:бежев\w*|beige)", "warm beige"),
    (r"(?:розов\w*|pink|pushti)", "soft pastel pink"),
    (r"(?:коричнев\w*|brown|jigarrang)", "rich chocolate brown"),
    (r"(?:оранжев\w*|orange)", "vibrant orange"),
]

SURFACE_RULES = [
    (r"(?:деревянн|стол\b|wood|table|yog'?och)", "on a rich dark rustic oak wooden tabletop"),
    (r"(?:мрамор|marble|marmar)", "on a polished white Italian marble countertop"),
    (r"(?:светл|бел|white|oq|light)", "in a pristine high-key bright white photo studio"),
    (r"(?:темн|черн|dark|qora|black|luxury)", "on a dark textured stone podium with moody atmosphere"),
    (r"(?:кафе|кофейн|cafe)", "on a cozy wooden cafe table with warm ambient bokeh"),
]


def extract_color_modifier(text: str) -> str:
    for pattern, color in COLOR_RULES:
        if re.search(pattern, text, re.IGNORECASE):
            return color
    return ""


def enrich_product_prompt(raw_prompt: str, theme: str = "") -> str:
    """
    Translates & enriches Russian, Uzbek, or English seller requests into
    hyper-realistic commercial studio e-commerce photography prompts.
    """
    t = (raw_prompt or "").strip().lower()
    color = extract_color_modifier(t)

    matched_subj = None
    for pattern, subj in SUBJECT_RULES:
        if re.search(pattern, t):
            matched_subj = subj
            break

    if matched_subj:
        if color:
            # Inject explicit color into subject
            words = matched_subj.split()
            # If color words like white/black are in template, replace or prepend
            cleaned_subj = re.sub(r'\b(white|black|dark)\b', color, matched_subj, flags=re.I)
            if color not in cleaned_subj:
                cleaned_subj = f"{color} {cleaned_subj}"
            subject = cleaned_subj
        else:
            subject = matched_subj
    else:
        # Clean query tokens
        clean = re.sub(
            r'^(?:сгенерируй|создай|сделай|нарисуй|rasm\s+yarat|generate|create|make)\s*(?:студийное|промо|коммерческое|красивое|новое|studio|a\s+studio)?\s*(?:изображение|фото|картинку|баннер|арт|image|photo|artwork)?\s*(?:для\s+товара|товара|для|uchun|for)?\s*',
            '',
            raw_prompt,
            flags=re.IGNORECASE
        ).strip()
        clean = re.sub(r'[\/«»"\'\.]', '', clean).strip()
        color_prefix = f"{color} " if color and color not in clean.lower() else ""
        subject = f"{color_prefix}commercial e-commerce product ({clean or 'item'})"

    # Surface & Setting
    surface = None
    for pattern, surf in SURFACE_RULES:
        if re.search(pattern, t):
            surface = surf
            break

    if not surface:
        if theme == "wood":
            surface = "on a rich dark rustic oak wooden tabletop"
        elif theme == "marble":
            surface = "on a polished white Italian marble countertop"
        elif theme == "clean_white":
            surface = "in a pristine high-key bright white photo studio"
        elif theme == "gourmet_warm":
            surface = "on a warm textured restaurant table with soft amber glow"
        elif theme == "dark_luxury":
            surface = "on a dark textured stone podium with moody rim lighting"
        else:
            surface = "in a clean professional e-commerce photo studio"

    full_prompt = (
        f"commercial studio product photography of {subject}, {surface}, "
        f"soft volumetric studio lighting, natural contact shadows, photorealistic, 8k resolution, e-commerce catalog packshot"
    )
    return full_prompt


def get_krea_device():
    """Returns optimal compute device for Apple Silicon M2 (MPS)."""
    global _DEVICE
    if _DEVICE is not None:
        return _DEVICE

    try:
        import torch
        target = getattr(settings, "DIFFUSERS_DEVICE", "mps")
        if target == "mps" and torch.backends.mps.is_available():
            _DEVICE = torch.device("mps")
        elif torch.cuda.is_available():
            _DEVICE = torch.device("cuda")
        else:
            _DEVICE = torch.device("cpu")
    except Exception:
        _DEVICE = "cpu"

    logger.info(f"StoreBox AI Diffusers compute device initialized: {_DEVICE}")
    return _DEVICE


def get_diffusers_t2i_pipeline():
    """
    Loads SD-Turbo Text2Image diffusers pipeline onto Apple Silicon MPS device.
    Uses singleton pattern and local cache for instant load times.
    """
    global _DIFFUSERS_T2I
    if _DIFFUSERS_T2I is not None:
        return _DIFFUSERS_T2I

    device = get_krea_device()
    model_id = getattr(settings, "DIFFUSERS_MODEL_ID", "stabilityai/sd-turbo")

    try:
        import torch
        from diffusers import AutoPipelineForText2Image

        logger.info(f"Loading {model_id} on {device} (torch.float16)...")
        pipe = None
        # Try local cache first for instant loading with zero network delay
        try:
            pipe = AutoPipelineForText2Image.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if str(device) != "cpu" else torch.float32,
                variant="fp16",
                local_files_only=True
            )
        except Exception as e_local:
            logger.debug(f"Local cache load failed ({e_local}), trying network fetch...")
            pipe = AutoPipelineForText2Image.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if str(device) != "cpu" else torch.float32,
                variant="fp16"
            )

        pipe = pipe.to(device)

        # M2 Unified Memory Optimization: Attention slicing
        if hasattr(pipe, "enable_attention_slicing"):
            pipe.enable_attention_slicing()

        _DIFFUSERS_T2I = pipe
        logger.info(f"Successfully loaded {model_id} Text2Image onto {device}!")
        return _DIFFUSERS_T2I
    except Exception as e:
        logger.warning(f"Diffusers Text2Image direct pipeline unavailable ({type(e).__name__}: {e}).")
        return None


def get_diffusers_i2i_pipeline():
    """
    Loads SD-Turbo Image2Image diffusers pipeline onto Apple Silicon MPS device.
    Reuses existing Text2Image pipeline components in memory to avoid duplicate RAM usage.
    """
    global _DIFFUSERS_I2I, _DIFFUSERS_T2I
    if _DIFFUSERS_I2I is not None:
        return _DIFFUSERS_I2I

    device = get_krea_device()
    model_id = getattr(settings, "DIFFUSERS_MODEL_ID", "stabilityai/sd-turbo")

    try:
        from diffusers import AutoPipelineForImage2Image
        import torch

        # Fast memory-shared initialization from already loaded T2I pipeline
        if _DIFFUSERS_T2I is not None:
            _DIFFUSERS_I2I = AutoPipelineForImage2Image.from_pipe(_DIFFUSERS_T2I)
            if hasattr(_DIFFUSERS_I2I, "enable_attention_slicing"):
                _DIFFUSERS_I2I.enable_attention_slicing()
            logger.info(f"Successfully initialized Image2Image pipeline from existing {model_id} weights in memory!")
            return _DIFFUSERS_I2I

        # Otherwise load directly
        try:
            pipe = AutoPipelineForImage2Image.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if str(device) != "cpu" else torch.float32,
                variant="fp16",
                local_files_only=True
            )
        except Exception:
            pipe = AutoPipelineForImage2Image.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if str(device) != "cpu" else torch.float32,
                variant="fp16"
            )

        pipe = pipe.to(device)
        if hasattr(pipe, "enable_attention_slicing"):
            pipe.enable_attention_slicing()

        _DIFFUSERS_I2I = pipe
        logger.info(f"Successfully loaded {model_id} Image2Image onto {device}!")
        return _DIFFUSERS_I2I
    except Exception as e:
        logger.warning(f"Diffusers Image2Image direct pipeline unavailable ({type(e).__name__}: {e}).")
        return None


def generate_real_ai_photo(
    prompt: str,
    theme: str = "",
    product_name: str = "Товар",
    store = None
) -> str:
    """
    Generates an authentic, high-quality 1024x1024 commercial product photograph
    using SD-Turbo on Apple Silicon M2 GPU (MPS).
    Returns media URL string (e.g. '/media/products/studio_gen_<uuid>.png').
    """
    start_time = time.time()
    pipe = get_diffusers_t2i_pipeline()

    if pipe is not None:
        try:
            enriched_prompt = enrich_product_prompt(prompt, theme=theme)
            logger.info(f"Generating AI Photo on MPS with prompt: {enriched_prompt}")

            out = pipe(
                prompt=enriched_prompt,
                num_inference_steps=1,
                guidance_scale=0.0,
                width=512,
                height=512
            )
            out_img = out.images[0]

            # Upscale cleanly to 1024x1024 HD commercial standard
            out_img = out_img.resize((1024, 1024), Image.Resampling.LANCZOS)

            rel_path = f"products/studio_gen_{uuid.uuid4().hex[:8]}.png"
            abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            out_img.save(abs_path, format="PNG", quality=95)

            duration = round(time.time() - start_time, 2)
            logger.info(f"Successfully generated photorealistic AI image {rel_path} in {duration}s!")
            return f"{settings.MEDIA_URL}{rel_path}"
        except Exception as e:
            logger.error(f"SD-Turbo MPS image generation failed: {e}. Falling back to studio compositor.")

    # Graceful fallback to studio compositor
    from .services_image import generate_studio_product_image
    return generate_studio_product_image(
        product_name=product_name or prompt,
        store_name=store.name if store else "StoreBox",
        theme=theme or "dark_luxury",
        store=store
    )


def run_krea_image_to_image(
    image_bytes: bytes,
    prompt: str,
    product_name: str = "Товар",
    store = None,
    strength: float = 0.55,
    num_inference_steps: int = 2
) -> dict:
    """
    Processes product image using SD-Turbo Image-to-Image pipeline on Apple Silicon MPS,
    with seamless fallback to Apple Silicon Neural Studio Inpaint Compositor.
    """
    start_time = time.time()
    device = get_krea_device()
    engine_name = f"SD-Turbo Diffusion ({device})"
    result_bytes = None

    pipe = get_diffusers_i2i_pipeline()
    if pipe is not None:
        try:
            init_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            init_image = init_image.resize((512, 512), Image.Resampling.LANCZOS)

            enriched_prompt = enrich_product_prompt(prompt)
            logger.info(f"Running Image-to-Image on {device} with prompt: {enriched_prompt}")

            out = pipe(
                prompt=enriched_prompt,
                image=init_image,
                strength=strength,
                num_inference_steps=num_inference_steps,
                guidance_scale=0.0
            )
            out_img = out.images[0]
            out_img = out_img.resize((1024, 1024), Image.Resampling.LANCZOS)

            buf = io.BytesIO()
            out_img.save(buf, format="PNG", quality=95)
            result_bytes = buf.getvalue()
        except Exception as e_inf:
            logger.warning(f"Image-to-Image MPS inference failed: {e_inf}. Falling back to Neural Studio compositor.")

    # Resilient Apple Silicon M2 Neural Studio Inpaint Fallback
    if not result_bytes:
        from .services_fooocus import process_image_to_image
        res = process_image_to_image(
            image_bytes=image_bytes,
            prompt=prompt,
            product_name=product_name,
            store=store
        )
        res["engine"] = f"Studio Inpaint Compositor ({device})"
        return res

    # Save result image
    out_rel = f"products/studio_i2i_{uuid.uuid4().hex[:8]}.png"
    out_abs = os.path.join(settings.MEDIA_ROOT, out_rel)
    os.makedirs(os.path.dirname(out_abs), exist_ok=True)
    with open(out_abs, "wb") as f:
        f.write(result_bytes)
    out_url = f"{settings.MEDIA_URL}{out_rel}"

    duration = round(time.time() - start_time, 2)

    return {
        "success": True,
        "image_url": out_url,
        "prompt": prompt,
        "theme": "studio_i2i",
        "theme_title": "Commercial Studio Packshot",
        "product_name": product_name,
        "engine": engine_name,
        "execution_time": f"{duration}s",
        "suggestions": [
            "🪵 Помести товар на деревянный стол",
            "🏛️ Сделай фон из белого мрамора",
            "📸 Профессиональный студийный свет циклорама",
            "Удали фон (rembg)",
            "Создай рекламный баннер",
        ]
    }
