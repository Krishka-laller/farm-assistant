"""Open-Meteo geocoding service.

Converts state/district names to lat/lon coordinates using
the free Open-Meteo geocoding API.
"""

import httpx

from app.models.errors import ServiceUnavailableError
from app.models.schemas import GeocodingResult

GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search"
TIMEOUT_SECONDS = 10


async def geocode_location(
    district: str,
    state: str,
) -> GeocodingResult | None:
    """Look up coordinates for a district in a state.

    Returns the first matching result within India,
    or None if no match is found.
    """
    query = f"{district}, {state}, India"
    params = {
        "name": query,
        "count": 5,
        "language": "en",
        "format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.get(GEOCODING_BASE, params=params)
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, httpx.TimeoutException):
        raise ServiceUnavailableError(
            service="Open-Meteo Geocoding",
            message="Location lookup is temporarily unavailable. Please try again.",
        )

    results = data.get("results", [])
    for r in results:
        if r.get("country_code", "").upper() == "IN":
            return GeocodingResult(
                lat=r["latitude"],
                lon=r["longitude"],
                name=r.get("name", district),
                state=r.get("admin1", state),
            )

    return None
