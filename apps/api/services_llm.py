"""
Legacy LLM helper module — now delegates to `services.ai_sidekick.SidekickBrain`.
"""
from services.ai_sidekick import SidekickBrain, SYSTEM_INSTRUCTION, GEMINI_FUNCTION_DECLARATIONS

__all__ = ["SidekickBrain", "SYSTEM_INSTRUCTION", "GEMINI_FUNCTION_DECLARATIONS"]
