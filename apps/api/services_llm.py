import os
import re
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# SSL Setup
try:
    import certifi
    DEFAULT_CA = certifi.where()
except Exception:
    DEFAULT_CA = True


def _safe_post(url: str, headers: dict, payload: dict, timeout: float = 12.0) -> tuple:
    """
    Performs resilient HTTP POST with certifi and insecure fallback.
    Returns (status_code, response_dict_or_str).
    """
    import requests
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=timeout, verify=DEFAULT_CA)
        return r.status_code, (r.json() if "application/json" in r.headers.get("Content-Type", "") else r.text)
    except Exception:
        try:
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            r = requests.post(url, headers=headers, json=payload, timeout=timeout, verify=False)
            return r.status_code, (r.json() if "application/json" in r.headers.get("Content-Type", "") else r.text)
        except Exception as e_inner:
            logger.warning(f"LLM request error for {url}: {e_inner}")
            return 0, str(e_inner)


# -------------------------------------------------------------------------
# 1. GROQ INFERENCE CLIENT (PRIMARY ULTRA-FAST AGENT)
# -------------------------------------------------------------------------
def _get_groq_models():
    configured_m = "qwen/qwen3.8-27b"
    if settings.configured:
        configured_m = getattr(settings, "GROQ_MODEL", configured_m)
    models = [configured_m, "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
    # De-duplicate while preserving order
    seen = set()
    return [m for m in models if not (m in seen or seen.add(m))]


def call_groq_llm(messages: list, temperature: float = 0.2, max_tokens: int = 700, response_format: dict = None) -> str:
    """
    Invokes Groq API with lowest latency (<1 sec response time).
    """
    api_key = ""
    if settings.configured:
        api_key = getattr(settings, "GROQ_API_KEY", "")
    api_key = api_key or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return ""

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "StoreBox-AI-Sidekick/1.0",
    }

    for model_name in _get_groq_models():
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        status, resp = _safe_post(url, headers, payload, timeout=8.0)
        if status == 200 and isinstance(resp, dict):
            choices = resp.get("choices", [])
            if choices and "message" in choices[0]:
                content = choices[0]["message"].get("content", "").strip()
                if content:
                    return content
        else:
            logger.debug(f"Groq {model_name} failed with status {status}: {resp}")

    return ""


# -------------------------------------------------------------------------
# 2. GEMINI INFERENCE CLIENT (SECONDARY / MULTIMODAL BACKUP)
# -------------------------------------------------------------------------
def _get_gemini_models():
    configured_m = "models/gemini-3.5-flash-lite"
    if settings.configured:
        configured_m = getattr(settings, "GEMINI_MODEL", configured_m)
    models = [configured_m, "models/gemini-3.5-flash-lite", "models/gemini-3.8-flash", "models/gemini-flash-latest"]
    seen = set()
    return [m for m in models if not (m in seen or seen.add(m))]


def call_gemini_llm(prompt_or_contents: list, system_instruction: str = "", temperature: float = 0.2) -> str:
    """
    Invokes Google AI Studio Gemini API as resilient backup.
    """
    api_key = ""
    if settings.configured:
        api_key = getattr(settings, "GEMINI_API_KEY", "")
    api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return ""

    headers = {"Content-Type": "application/json"}

    for model_name in _get_gemini_models():
        url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={api_key}"

        if isinstance(prompt_or_contents, str):
            contents = [{"parts": [{"text": prompt_or_contents}]}]
        elif isinstance(prompt_or_contents, list):
            parts = []
            for m in prompt_or_contents:
                role = m.get("role", "user")
                text = m.get("content", "")
                prefix = "System: " if role == "system" else ("User: " if role == "user" else "Assistant: ")
                parts.append(f"{prefix}{text}")
            contents = [{"parts": [{"text": "\n\n".join(parts)}]}]
        else:
            contents = [{"parts": [{"text": str(prompt_or_contents)}]}]

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 700,
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        status, resp = _safe_post(url, headers, payload, timeout=12.0)
        if status == 200 and isinstance(resp, dict):
            candidates = resp.get("candidates", [])
            if candidates:
                first = candidates[0].get("content", {}).get("parts", [])
                text = "".join(p.get("text", "") for p in first).strip()
                if text:
                    return text
        else:
            logger.debug(f"Gemini {model_name} failed with status {status}: {resp}")

    return ""


# -------------------------------------------------------------------------
# 3. STRUCTURED FUNCTION CALLING DISPATCHER
# -------------------------------------------------------------------------
def call_hybrid_function_call(user_message: str, store_context: dict, tools_schema: list, lang: str = "ru") -> dict:
    """
    Evaluates seller message against store data and tools schema.
    Returns: { "thought": str, "tool": str, "parameters": dict } or {}
    Tries: Groq (Primary) -> Gemini (Backup)
    """
    lang_upper = (lang or "ru").upper()
    sys_instruction = (
        f"You are the cognitive Function Calling engine for StoreBox Sidekick (Shopify Sidekick standard for Uzbekistan).\n"
        f"Current store: '{store_context.get('store_name', 'StoreBox Store')}'\n"
        f"Store context: {store_context.get('total_products', 0)} catalog products, {store_context.get('total_orders', 0)} orders, "
        f"7-day sales revenue: {int(store_context.get('revenue_7d', 0)):,} UZS, best seller: '{store_context.get('top_product_name', 'None')}'.\n\n"
        f"Tools Schema:\n{json.dumps(tools_schema, ensure_ascii=False, indent=2)}\n\n"
        f"Instructions:\n"
        f"1. You MUST respond ONLY with a single JSON object (no markdown, no backticks, no extra text).\n"
        f"2. Required JSON structure:\n"
        f'{{"thought": "<concise strategic reasoning in {lang_upper}>", "tool": "<tool_name or chat_reply>", "parameters": {{ ... }}}}\n'
        f"3. If user wants an action (analytics, stock, discount, promo, image creation, inpaint photo edit, remove background, lookup, order view), "
        f"select the appropriate tool name and extract clean parameters.\n"
        f"4. If user asks general business question, greetings, or strategy that needs free-form advice, set tool to 'chat_reply' or 'general_business_advice'."
    )

    # 1. Attempt Groq
    groq_messages = [
        {"role": "system", "content": sys_instruction},
        {"role": "user", "content": user_message}
    ]
    raw_groq = call_groq_llm(groq_messages, temperature=0.1, max_tokens=400)
    parsed = _parse_json_result(raw_groq)
    if parsed and "tool" in parsed:
        return parsed

    # 2. Attempt Gemini
    gemini_prompt = (
        f"{sys_instruction}\n\n"
        f"User request: {user_message}\n"
        f"Respond with JSON ONLY: {{\"thought\": \"...\", \"tool\": \"...\", \"parameters\": {{...}}}}"
    )
    raw_gemini = call_gemini_llm(gemini_prompt, temperature=0.1)
    parsed_gemini = _parse_json_result(raw_gemini)
    if parsed_gemini and "tool" in parsed_gemini:
        return parsed_gemini

    return {}


def call_hybrid_chat_reply(user_message: str, store_context: dict, lang: str = "ru") -> str:
    """
    Generates rich, fluent conversational business strategist reply.
    Tries: Groq -> Gemini
    """
    lang_upper = (lang or "ru").upper()
    sys_prompt = (
        f"You are StoreBox Sidekick, an elite e-commerce AI co-founder and growth partner for '{store_context.get('store_name', 'StoreBox Store')}'.\n"
        f"Store Metrics: {store_context.get('total_products', 0)} products, {store_context.get('total_orders', 0)} orders, "
        f"7-day revenue: {int(store_context.get('revenue_7d', 0)):,} UZS, best seller: '{store_context.get('top_product_name', 'None')}'.\n"
        f"Language: {lang_upper} (fluent, warm, professional, native phrasing without robotic tone).\n"
        f"Formatting: Use clear markdown with bold headers and bullet points. Provide concrete, actionable business recommendations for the seller."
    )

    # 1. Groq
    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": user_message}
    ]
    reply = call_groq_llm(messages, temperature=0.4, max_tokens=700)
    if reply:
        return reply

    # 2. Gemini
    reply_gemini = call_gemini_llm(user_message, system_instruction=sys_prompt, temperature=0.4)
    if reply_gemini:
        return reply_gemini

    return ""


def _parse_json_result(raw_text: str) -> dict:
    """Safely extracts JSON object from LLM response text."""
    if not raw_text:
        return {}
    clean = raw_text.strip()
    match = re.search(r'\{.*\}', clean, re.DOTALL)
    if match:
        try:
            val = json.loads(match.group(0))
            if isinstance(val, dict):
                return val
        except Exception:
            pass
    return {}
