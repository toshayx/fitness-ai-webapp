import json
import re

import httpx

from app.config import get_settings
from app.schemas import NutritionData

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """You are a nutrition expert. Given a food description or image, estimate the nutritional content as accurately as possible.

IMPORTANT: You MUST respond with ONLY a valid JSON object, no markdown, no explanation, no extra text. The JSON must have exactly these fields:
{
  "food_name": "short descriptive name of the food",
  "kcals": <integer>,
  "fats_g": <number>,
  "saturated_fats_g": <number>,
  "carbs_g": <number>,
  "proteins_g": <number>,
  "sodium_mg": <number>
}

If the input contains multiple foods, sum them into a single entry and use a combined name.
Base estimates on standard serving sizes unless a quantity is specified."""

AVAILABLE_MODELS = [
    {"id": "anthropic/claude-sonnet-4", "name": "Claude Sonnet 4", "supports_vision": True},
    {"id": "google/gemini-2.5-flash", "name": "Gemini 2.5 Flash", "supports_vision": True},
    {"id": "google/gemini-2.5-pro", "name": "Gemini 2.5 Pro", "supports_vision": True},
    {"id": "openai/gpt-4o", "name": "GPT-4o", "supports_vision": True},
    {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini", "supports_vision": True},
]


def _extract_json(text: str) -> dict:
    """Extract JSON from a response that might contain markdown fences or extra text."""
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fenced:
        text = fenced.group(1)

    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end != -1:
        text = text[brace_start : brace_end + 1]

    return json.loads(text)


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
        "max_tokens": 500,
    }

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
    raw_text = data["choices"][0]["message"]["content"]
    parsed = _extract_json(raw_text)
    nutrition = NutritionData(**parsed)

    return nutrition, raw_text
