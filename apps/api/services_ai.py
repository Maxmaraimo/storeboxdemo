"""
StoreBox AI Utilities & Sidekick Agent Bridge.
Provides local `rembg` background removal (`remove_image_background`)
and bridges `SidekickAgent` to `services.ai_sidekick.SidekickBrain`.
"""
import os
import logging
from io import BytesIO
from services.ai_sidekick import SidekickBrain, detect_language

logger = logging.getLogger(__name__)

_REMBG_SESSION = None


def get_rembg_session():
    global _REMBG_SESSION
    if _REMBG_SESSION is None:
        try:
            import rembg
            os.environ["U2NET_HOME"] = os.path.expanduser("~")
            _REMBG_SESSION = rembg.new_session("u2net")
        except Exception:
            pass
    return _REMBG_SESSION


def remove_image_background(input_path_or_bytes) -> bytes:
    """Removes image background locally using rembg with clean alpha fallback."""
    if isinstance(input_path_or_bytes, (bytes, bytearray)):
        img_bytes = input_path_or_bytes
    else:
        with open(input_path_or_bytes, "rb") as f:
            img_bytes = f.read()

    try:
        import rembg
        session = get_rembg_session()
        if session is not None:
            return rembg.remove(img_bytes, session=session)
        return rembg.remove(img_bytes)
    except Exception as e:
        logger.debug("rembg fallback: %s", e)

    try:
        from PIL import Image
        im = Image.open(BytesIO(img_bytes)).convert("RGBA")
        out = BytesIO()
        im.save(out, format="PNG")
        return out.getvalue()
    except Exception:
        return img_bytes


class SidekickAgent(SidekickBrain):
    """Bridge class pointing to the official Gemini + Function Calling SidekickBrain."""

    def process_message(self, message: str) -> dict:
        return self.process_chat(message)
