"""Gemini API wrapper with system prompt enforcement."""

import asyncio
import json
import logging

from fastapi import HTTPException
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-120b"
GEMINI_TIMEOUT_SECONDS = 30

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "pa": "Punjabi",
    "mr": "Marathi",
    "gu": "Gujarati",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
}

SYSTEM_PROMPT = """You are a farming advisor for Indian farmers. Rules you must always follow:

1. Answer in the SAME language the user writes in. If they write in Hindi, answer in Hindi. If Tamil, answer in Tamil.
2. Be concise and practical. Farmers need actionable advice, not essays.
3. Never invent mandi prices, weather data, or scientific claims. If you do not have real data, say so.
4. When you are uncertain, say: "I am not sure about this. Please consult your local Krishi Vigyan Kendra (KVK) for expert advice."
5. For ANY question about specific chemical dosages, pesticide concentrations, or mixing ratios: do NOT provide specific numbers. Say: "Please follow the exact dosage on the product label. For guidance, contact your nearest Krishi Vigyan Kendra."
6. For disease identification: if confidence is not high, clearly state your uncertainty.
7. Never recommend banned pesticides or chemicals.
8. Be respectful and use language appropriate for rural users.
9. Never give seed rates, fertilizer quantities, pesticide amounts or any dose with a number and unit, even approximate. Say to follow the product label and ask the local KVK."""

DISCLAIMER_TEXT = {
    "en": "This advice is for informational purposes only. For serious crop issues or chemical guidance, consult your local Krishi Vigyan Kendra (KVK).",
    "hi": "यह सलाह केवल जानकारी के लिए है। गंभीर फसल समस्याओं या रासायनिक मार्गदर्शन के लिए अपने स्थानीय कृषि विज्ञान केंद्र (KVK) से संपर्क करें।",
    "pa": "ਇਹ ਸਲਾਹ ਸਿਰਫ਼ ਜਾਣਕਾਰੀ ਲਈ ਹੈ। ਗੰਭੀਰ ਫ਼ਸਲ ਸਮੱਸਿਆਵਾਂ ਜਾਂ ਰਸਾਇਣਕ ਮਾਰਗਦਰਸ਼ਨ ਲਈ ਆਪਣੇ ਸਥਾਨਕ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ (KVK) ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
    "mr": "हा सल्ला केवळ माहितीसाठी आहे। गंभीर पीक समस्या किंवा रासायनिक मार्गदर्शनासाठी आपल्या स्थानिक कृषी विज्ञान केंद्राशी (KVK) संपर्क साधा.",
    "gu": "આ સલાહ ફક્ત માહિતી માટે છે. ગંભીર પાક સમસ્યાઓ અથવા રાસાયણિક માર્ગદર્શન માટે તમારા સ્થાનિક કૃષિ વિજ્ઞાન કેન્દ્ર (KVK) નો સંપર્ક કરો.",
    "ta": "இந்த ஆலோசனை தகவல் நோக்கத்திற்காக மட்டுமே. தீவிர பயிர் பிரச்சினைகள் அல்லது இரசாயன வழிகாட்டுதலுக்கு உங்கள் உள்ளூர் கிருஷி விக்யான் கேந்திராவை (KVK) தொடர்பு கொள்ளுங்கள்.",
    "te": "ఈ సలహా సమాచార ప్రయోజనాల కోసం మాత్రమే. తీవ్రమైన పంట సమస్యలు లేదా రసాయన మార్గదర్శకత్వం కోసం మీ స్థానిక కృషి విజ్ఞాన్ కేంద్రాన్ని (KVK) సంప్రదించండి.",
    "bn": "এই পরামর্শ শুধুমাত্র তথ্যমূলক উদ্দেশ্যে। গুরুতর ফসল সমস্যা বা রাসায়নিক নির্দেশনার জন্য আপনার স্থানীয় কৃষি বিজ্ঞান কেন্দ্র (KVK) এর সাথে যোগাযোগ করুন।",
}


def get_disclaimer(lang: str) -> str:
    return DISCLAIMER_TEXT.get(lang, DISCLAIMER_TEXT["en"])


def _require_key() -> str:
    key = get_settings().groq_api_key
    if not key:
        raise HTTPException(
            status_code=503,
            detail="The AI service is not configured. GROQ_API_KEY is missing.",
        )
    return key


async def _call_llm(messages: list[dict], temperature: float = 0.3) -> str:
    headers = {"Authorization": f"Bearer {_require_key()}"}
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 4096,
    }
    try:
        async with httpx.AsyncClient(timeout=GEMINI_TIMEOUT_SECONDS) as client:
            resp = await client.post(GROQ_URL, headers=headers, json=payload)
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="The AI service took too long. Please try again.")
    except httpx.HTTPError as exc:
        logger.error("LLM call failed: %s", type(exc).__name__)
        raise HTTPException(status_code=503, detail="The AI service is not available right now. Please try again.")

    if resp.status_code != 200:
        logger.error("LLM call failed: HTTP %s", resp.status_code)
        raise HTTPException(status_code=503, detail="The AI service is not available right now. Please try again.")

    try:
        text = (resp.json()["choices"][0]["message"]["content"] or "").strip()
    except (KeyError, IndexError, ValueError):
        text = ""
    if not text:
        raise HTTPException(status_code=503, detail="The AI service returned an empty answer. Please try again.")
    return text


async def generate_chat_response(
    message: str,
    lang: str,
    history: list[dict] | None = None,
    context: str | None = None,
) -> str:
    """Generate a chat response."""
    language_name = LANGUAGE_NAMES.get(lang, "English")
    system_instruction = (
        f"{SYSTEM_PROMPT}\n\n"
        f"The app language is {language_name}. Reply in {language_name} "
        f"unless the user clearly writes in another language."
    )
    if context:
        system_instruction += f"\n\nContext: {context}"

    messages = [{"role": "system", "content": system_instruction}]
    for item in history or []:
        role = "user" if item["role"] == "user" else "assistant"
        messages.append({"role": role, "content": item["content"]})
    messages.append({"role": "user", "content": message})
    return await _call_llm(messages)


async def analyze_disease_image(
    image_bytes: bytes,
    lang: str,
    crop_name: str | None = None,
) -> dict:
    """Photo analysis is not enabled with the current AI provider."""
    raise HTTPException(
        status_code=503,
        detail="Photo analysis is not available yet.",
    )


import re

_DOSE_PATTERN = re.compile(
    r"\d\s*(?:kg|gm|g|ml|l|ppm|%|किलो|ग्राम|मिली|लीटर)", re.IGNORECASE
)

_FERTILIZER_FALLBACK = (
    "Always follow the dosage on the product label and consult your "
    "local Krishi Vigyan Kendra (KVK)."
)


def _contains_dose(text: str) -> bool:
    return bool(_DOSE_PATTERN.search(text or ""))


def _parse_json_object(text: str) -> dict:
    text = text.replace("```json", "").replace("```", "").strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise HTTPException(
            status_code=503,
            detail="The AI service gave an unreadable answer. Please try again.",
        )
    try:
        data = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=503,
            detail="The AI service gave an unreadable answer. Please try again.",
        )
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=503,
            detail="The AI service gave an unreadable answer. Please try again.",
        )
    return data


async def generate_crop_recommendations(
    lat: float,
    lon: float,
    soil_type: str,
    season: str,
    water_availability: str,
    lang: str,
    weather_summary: str | None = None,
) -> list[dict]:
    """Return up to 5 crop suggestions as a list of dicts."""
    language_name = LANGUAGE_NAMES.get(lang, "English")
    system_instruction = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Write crop_name and reasoning in {language_name}. "
        "Respond ONLY with a JSON object, no markdown, in this shape: "
        '{"recommendations": [{"crop_name": str, "suitability_score": number '
        'between 0 and 1, "reasoning": str, "expected_duration_days": integer '
        'or null, "water_requirement": str or null}]}. '
        "Suggest 3 to 5 crops that suit Indian conditions. Base the reasoning "
        "only on the inputs given. Do not claim to know local mandi prices or "
        "exact local yields. Keep each reasoning to 1 or 2 short sentences."
    )
    user_text = (
        f"Location: latitude {lat}, longitude {lon}. "
        f"Soil type: {soil_type}. Season: {season}. "
        f"Water availability: {water_availability}."
    )
    if weather_summary:
        user_text += f" Current weather: {weather_summary}."

    text = await _call_llm(
        [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_text},
        ],
        temperature=0.2,
    )
    data = _parse_json_object(text)

    cleaned = []
    for item in data.get("recommendations", [])[:5]:
        if not isinstance(item, dict) or not item.get("crop_name"):
            continue
        try:
            score = float(item.get("suitability_score", 0.5))
        except (TypeError, ValueError):
            score = 0.5
        item["suitability_score"] = max(0.0, min(1.0, score))
        item["reasoning"] = str(item.get("reasoning", ""))
        days = item.get("expected_duration_days")
        item["expected_duration_days"] = days if isinstance(days, int) else None
        cleaned.append(item)
    return cleaned


async def generate_fertilizer_guidance(
    crop_name: str,
    issue_description: str,
    lang: str,
    soil_type: str | None = None,
) -> dict:
    """Return general fertilizer guidance. Never specific doses."""
    language_name = LANGUAGE_NAMES.get(lang, "English")
    system_instruction = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Write all text values in {language_name}. "
        "Respond ONLY with a JSON object, no markdown, in this shape: "
        '{"general_advice": str, "recommendations": [{"guidance_type": str, '
        '"general_advice": str, "safety_practices": [str], '
        '"application_timing": str or null}]}. '
        "Give 2 to 3 recommendations. Talk only about general types of "
        "nutrients or practices, for example nitrogen rich fertilizer or "
        "organic compost. Do NOT give any dose, quantity, concentration, "
        "mixing ratio, number with a unit, or brand name. Tell the farmer to "
        "follow the product label and contact the local KVK."
    )
    user_text = f"Crop: {crop_name}. Problem: {issue_description}."
    if soil_type:
        user_text += f" Soil type: {soil_type}."

    text = await _call_llm(
        [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_text},
        ],
        temperature=0.2,
    )
    data = _parse_json_object(text)

    recs = []
    for item in data.get("recommendations", [])[:3]:
        if not isinstance(item, dict):
            continue
        blob = json.dumps(item, ensure_ascii=False)
        if _contains_dose(blob):
            continue
        item["guidance_type"] = str(item.get("guidance_type", ""))
        item["general_advice"] = str(item.get("general_advice", ""))
        practices = item.get("safety_practices", [])
        item["safety_practices"] = [str(p) for p in practices] if isinstance(practices, list) else []
        recs.append(item)

    general = str(data.get("general_advice", ""))
    if not general or _contains_dose(general):
        general = _FERTILIZER_FALLBACK
    return {"general_advice": general, "recommendations": recs}