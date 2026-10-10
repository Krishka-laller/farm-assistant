"""Mandi price lookup endpoint."""

from datetime import datetime, timezone

from fastapi import APIRouter, Query, Request

from app.middleware.rate_limit import limiter
from app.config import get_settings
from app.models.schemas import LanguageCode, MandiPriceResponse
from app.models.errors import ApiError
from app.services.mandi import fetch_mandi_prices

router = APIRouter(prefix="/api/mandi", tags=["Mandi"])


@router.get(
    "/prices",
    response_model=MandiPriceResponse,
    responses={
        400: {"model": ApiError},
        429: {"model": ApiError},
        500: {"model": ApiError},
        503: {"model": ApiError},
    },
)
@limiter.limit(get_settings().rate_limit_default)
async def get_mandi_prices(
    request: Request,
    state: str = Query(..., min_length=2, max_length=50, description="State name"),
    district: str = Query(default=None, max_length=50),
    commodity: str = Query(default=None, max_length=50),
    lang: LanguageCode = Query(default=LanguageCode.en),
) -> MandiPriceResponse:
    """Look up mandi commodity prices from Agmarknet (data.gov.in).

    Results are cached for 1 hour. Source and last-updated time are always shown.
    If data.gov.in is unreachable, returns a clear error, never fake data.
    """
    result = await fetch_mandi_prices(state, district, commodity)

    return MandiPriceResponse(
        records=result["records"],
        total_count=result["total_count"],
        source="Agmarknet, data.gov.in",
        last_updated=result["last_updated"],
        lang=lang,
    )
