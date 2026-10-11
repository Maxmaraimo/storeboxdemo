"""
StoreBox Sidekick AI Assistant Service Layer (Shopify Sidekick Architecture).
Delegates directly to `services.ai_sidekick.SidekickBrain` (Gemini 2.5 Flash + Function Calling)
and `services.tts_service` (ElevenLabs Multilingual v2 TTS).
"""
from services.ai_sidekick import SidekickBrain, GEMINI_FUNCTION_DECLARATIONS, SYSTEM_INSTRUCTION
from services.tts_service import generate_voice_response, generate_voice_payload

SIDEKICK_FUNCTION_TOOLS = GEMINI_FUNCTION_DECLARATIONS


class StoreBoxAIAssistantService(SidekickBrain):
    """
    Backwards-compatible service wrapper around `SidekickBrain`.
    Strictly isolated per active Store tenant (`request.tenant` / `active_store_id`).
    """

    def process_message(self, message: str, history=None, voice_enabled: bool = False) -> dict:
        result = self.process_chat(message=message, history=history)
        if voice_enabled and result.get("text"):
            voice_data = generate_voice_payload(result["text"])
            result["audio_base64"] = voice_data["audio_base64"]
            result["use_browser_tts"] = voice_data["use_browser_tts"]
        else:
            result["audio_base64"] = None
            result["use_browser_tts"] = False
        return result
