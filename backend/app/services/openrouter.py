import json
import logging
import re

import httpx

logger = logging.getLogger(__name__)

from app.config import get_settings
from app.schemas import NutritionData

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """Nutrition estimator. Reply with ONLY this JSON, nothing else:
{"food_name":"<short name>","kcals":0,"fats_g":0,"saturated_fats_g":0,"carbs_g":0,"proteins_g":0,"sodium_mg":0}
Sum multiple foods into one entry. No explanation, no markdown, no text before or after the JSON."""

AVAILABLE_MODELS = [
    {"id": "anthropic/claude-sonnet-4.6", "name": "Claude Sonnet 4.6", "supports_vision": True},
    {"id": "anthropic/claude-opus-4.6", "name": "Claude Opus 4.6", "supports_vision": True},
    {"id": "google/gemini-3-flash-preview", "name": "Gemini 3 Flash Preview", "supports_vision": True},
    {"id": "google/gemini-3.1-pro-preview", "name": "Gemini 3.1 Pro Preview", "supports_vision": True},
]


def _sanitize_json_string(text: str) -> str:
    """Collapse literal newlines/tabs inside JSON string values into spaces."""
    result = []
    in_string = False
    escape = False
    for ch in text:
        if escape:
            result.append(ch)
            escape = False
            continue
        if ch == "\\":
            escape = True
            result.append(ch)
            continue
        if ch == '"':
            in_string = not in_string
            result.append(ch)
            continue
        if in_string and ch in ("\n", "\r", "\t"):
            result.append(" ")
            continue
        result.append(ch)
    return "".join(result)


def _extract_json(text: str) -> dict:
    """Extract JSON from a response that might contain markdown fences or extra text."""
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fenced:
        text = fenced.group(1)

    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end != -1:
        text = text[brace_start : brace_end + 1]

    sanitized = _sanitize_json_string(text)
    sanitized = re.sub(r",\s*}", "}", sanitized)

    try:
        return json.loads(sanitized)
    except json.JSONDecodeError as e:
        logger.error("JSON parse failed. Raw text repr: %r", text)
        logger.error("Sanitized repr: %r", sanitized)
        raise ValueError(f"Could not parse AI response: {e}") from e


async def analyze_food(
    text: str | None = None,
    image_base64: str | None = None,
    model: str = "anthropic/claude-sonnet-4",
) -> tuple[NutritionData, str]:
    """Send food description or image to OpenRouter and return parsed nutrition data.

    Returns (NutritionData, raw_response_text).
    """
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not configured")

    content_parts: list[dict] = []
    if text:
        content_parts.append({"type": "text", "text": text})
    if image_base64:
        mime = "image/jpeg"
        if image_base64.startswith("data:"):
            mime = image_base64.split(";")[0].split(":")[1]
            image_base64 = image_base64.split(",", 1)[1]
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": f"data:{mime};base64,{image_base64}"},
        })

    if not content_parts:
        raise ValueError("Provide either text or an image")

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content_parts},
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
    }

    if "claude" in model or "gpt" in model:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            OPENROUTER_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            },
        )
        resp.raise_for_status()

    data = resp.json()

    if "error" in data:
        raise ValueError(f"OpenRouter error: {data['error']}")

    choice = data["choices"][0]
    finish = choice.get("finish_reason", "unknown")
    raw_text = choice["message"]["content"] or ""

    logger.info("Model: %s | finish_reason: %s | response length: %d", model, finish, len(raw_text))

    if finish == "length":
        logger.warning("Response truncated (finish=length): %r", raw_text[:300])
        raise ValueError(
            "AI response was cut off (token limit). "
            "Try a different model or simplify your input."
        )

    parsed = _extract_json(raw_text)
    nutrition = NutritionData(**parsed)

    return nutrition, raw_text
