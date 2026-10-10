"""Crop recommendation endpoint."""

from fastapi import APIRouter, Request

from app.middleware.rate_limit import limiter
from app.config import get_settings
from app.models.schemas import CropRecommendation, CropRecommendRequest, CropRecommendResponse
from app.models.errors import ApiError
from app.services.gemini import generate_crop_recommendations, get_disclaimer
from app.services.weather import fetch_weather

router = APIRouter(prefix="/api/crop", tags=["Crop"])


@router.post(
    "/recommend",
    response_model=CropRecommendResponse,
    responses={
        400: {"model": ApiError},
        429: {"model": ApiError},
        500: {"model": ApiError},
        503: {"model": ApiError},
    },
)
@limiter.limit(get_settings().rate_limit_default)
async def recommend_crop(request: Request, body: CropRecommendRequest) -> CropRecommendResponse:
    """Get crop recommendations based on location, soil, season, and water availability.

    Fetches current weather for context, then asks Gemini for recommendations.
    """
    weather_summary = None
    try:
        w_data = await fetch_weather(body.lat, body.lon)
        if w_data and "current" in w_data:
            cur = w_data["current"]
            weather_summary = f"{cur.temp_c}°C, {cur.weather_description or ''}"
    except Exception:
        pass

    raw_recs = await generate_crop_recommendations(
        lat=body.lat,
        lon=body.lon,
        soil_type=body.soil_type.value,
        season=body.season.value,
        water_availability=body.water_availability.value,
        lang=body.lang.value,
        weather_summary=weather_summary,
    )
    recs = []
    for r in raw_recs:
        try:
            recs.append(CropRecommendation(**r))
        except Exception:
            pass

    return CropRecommendResponse(
        recommendations=recs,
        lang=body.lang,
        disclaimer=get_disclaimer(body.lang.value),
        weather_summary=weather_summary,
    )
