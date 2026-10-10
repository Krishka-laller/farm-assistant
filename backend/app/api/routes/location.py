"""Location endpoint: state/district lists and geocoding."""

import json
from pathlib import Path

from fastapi import APIRouter, Query, Request

from app.middleware.rate_limit import limiter
from app.config import get_settings
from app.models.schemas import GeocodingResult, StateInfo
from app.models.errors import ApiError
from app.services.geocoding import geocode_location

router = APIRouter(prefix="/api/location", tags=["Location"])

# Load state/district data from static JSON
_LOCATIONS_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "locations.json"
_locations_cache: list[StateInfo] | None = None


def _load_locations() -> list[StateInfo]:
    global _locations_cache
    if _locations_cache is not None:
        return _locations_cache
    if _LOCATIONS_PATH.exists():
        with open(_LOCATIONS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        _locations_cache = [StateInfo(**s) for s in data]
    else:
        _locations_cache = []
    return _locations_cache


@router.get(
    "/states",
    response_model=list[StateInfo],
    responses={500: {"model": ApiError}},
)
@limiter.limit(get_settings().rate_limit_default)
async def get_states(request: Request) -> list[StateInfo]:
    """Get list of Indian states with their districts.

    This is static data bundled with the application.
    Used to populate state/district dropdowns in the frontend.
    """
    return _load_locations()


@router.get(
    "/geocode",
    response_model=GeocodingResult | None,
    responses={
        400: {"model": ApiError},
        503: {"model": ApiError},
    },
)
@limiter.limit(get_settings().rate_limit_default)
async def geocode(
    request: Request,
    district: str = Query(..., min_length=2, max_length=100),
    state: str = Query(..., min_length=2, max_length=100),
) -> GeocodingResult | None:
    """Convert a district and state name to lat/lon coordinates.

    Uses Open-Meteo geocoding API. Returns None if no match found.
    """
    return await geocode_location(district, state)
