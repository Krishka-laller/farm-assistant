"""Weather endpoint: forecast and farming advice."""

from datetime import datetime, timezone

from fastapi import APIRouter, Query, Request

from app.middleware.rate_limit import limiter
from app.config import get_settings
from app.models.schemas import LanguageCode, WeatherResponse
from app.models.errors import ApiError
from app.services.gemini import get_disclaimer
from app.services.weather import fetch_weather

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get(
    "",
    response_model=WeatherResponse,
    responses={
        400: {"model": ApiError},
        429: {"model": ApiError},
        500: {"model": ApiError},
        503: {"model": ApiError},
    },
)
@limiter.limit(get_settings().rate_limit_default)
async def get_weather(
    request: Request,
    lat: float = Query(..., ge=6.0, le=37.0, description="Latitude"),
    lon: float = Query(..., ge=68.0, le=97.5, description="Longitude"),
    lang: LanguageCode = Query(default=LanguageCode.en),
) -> WeatherResponse:
    """Get weather forecast and farming advice for a location.

    Fetches real data from Open-Meteo. Farming advice is generated
    by Gemini based on the forecast (Phase 2).
    """
    weather_data = await fetch_weather(lat, lon)

    # Phase 2: generate farming advice via Gemini based on weather_data
    return WeatherResponse(
        current=weather_data["current"],
        forecast=weather_data["forecast"],
        farming_advice=[],  # Phase 2: Gemini-generated advice
        source="Open-Meteo",
        last_updated=weather_data["last_updated"],
        lang=lang,
        disclaimer=get_disclaimer(lang.value),
    )
