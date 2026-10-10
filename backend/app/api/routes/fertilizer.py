"""Fertilizer and pesticide guidance endpoint.

Provides general guidance ONLY. No specific chemical names, concentrations,
or dosages from the LLM. Always refers to product label and KVK.
"""

from fastapi import APIRouter, Request

from app.middleware.rate_limit import limiter
from app.config import get_settings
from app.models.schemas import FertilizerGuidance, FertilizerGuideRequest, FertilizerGuideResponse
from app.models.errors import ApiError
from app.services.gemini import generate_fertilizer_guidance, get_disclaimer

router = APIRouter(prefix="/api/fertilizer", tags=["Fertilizer"])


@router.post(
    "/guide",
    response_model=FertilizerGuideResponse,
    responses={
        400: {"model": ApiError},
        429: {"model": ApiError},
        500: {"model": ApiError},
        503: {"model": ApiError},
    },
)
@limiter.limit(get_settings().rate_limit_default)
async def get_fertilizer_guide(
    request: Request,
    body: FertilizerGuideRequest,
) -> FertilizerGuideResponse:
    """Get general fertilizer and pesticide guidance.

    This endpoint never returns specific chemical dosages.
    It provides general type guidance (e.g. "nitrogen-based fertilizer"),
    application timing, safety practices, and always refers the user to:
    1. The product label for exact dosage
    2. Their local Krishi Vigyan Kendra for expert advice
    """
    guidance = await generate_fertilizer_guidance(
        crop_name=body.crop_name,
        issue_description=body.issue_description,
        lang=body.lang.value,
        soil_type=body.soil_type.value if body.soil_type else None,
    )
    recs = []
    for r in guidance.get("recommendations", []):
        try:
            recs.append(FertilizerGuidance(**r))
        except Exception:
            pass

    return FertilizerGuideResponse(
        recommendations=recs,
        general_advice=guidance.get(
            "general_advice",
            "Always consult product labels and your local Krishi Vigyan Kendra (KVK).",
        ),
        refer_to_expert=True,
        lang=body.lang,
        disclaimer=get_disclaimer(body.lang.value),
    )
