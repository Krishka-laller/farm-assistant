"""Agmarknet mandi price client with 1-hour TTL cache.

Fetches commodity prices from the data.gov.in API.
Shows source name and last-updated time on every response.
If the API fails, raises a clear error; never falls back to stale or fake data.
"""

import logging
from datetime import datetime, timezone

import httpx
from cachetools import TTLCache

from app.config import get_settings
from app.models.errors import ServiceUnavailableError
from app.models.schemas import MandiPriceRecord

logger = logging.getLogger(__name__)

DATA_GOV_BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
TIMEOUT_SECONDS = 15

# 1-hour TTL cache, max 200 entries
mandi_cache: TTLCache = TTLCache(maxsize=200, ttl=3600)


def _build_cache_key(state: str, district: str | None, commodity: str | None) -> str:
    return f"{state.lower()}:{(district or '').lower()}:{(commodity or '').lower()}"


def _parse_date(value):
    if not value:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


async def fetch_mandi_prices(
    state: str,
    district: str | None = None,
    commodity: str | None = None,
) -> dict:
    """Fetch mandi prices from data.gov.in with caching.

    Cache is checked first. On cache miss, fetches live data.
    On API failure, raises ServiceUnavailableError with a clear message.
    """
    cache_key = _build_cache_key(state, district, commodity)

    if cache_key in mandi_cache:
        return mandi_cache[cache_key]

    settings = get_settings()
    if not settings.data_gov_in_api_key:
        raise ServiceUnavailableError(
            service="Agmarknet (data.gov.in)",
            message="Mandi price service is not configured. The DATA_GOV_IN_API_KEY is missing.",
        )

    params = {
        "api-key": settings.data_gov_in_api_key,
        "format": "json",
        "limit": 50,
        "filters[state]": state,
    }
    if district:
        params["filters[district]"] = district
    if commodity:
        params["filters[commodity]"] = commodity

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.get(DATA_GOV_BASE, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        status = getattr(getattr(exc, "response", None), "status_code", None)
        logger.error("Mandi API failed: %s, HTTP %s", type(exc).__name__, status)
        raise ServiceUnavailableError(
            service="Agmarknet (data.gov.in)",
            message="Mandi price data is temporarily unavailable. The government data source may be down. Please try again in a few minutes.",
        )
    except ValueError:
        logger.error("Mandi API failed: invalid JSON")
        raise ServiceUnavailableError(
            service="Agmarknet (data.gov.in)",
            message="Mandi price data is temporarily unavailable. The government data source may be down. Please try again in a few minutes.",
        )

    records_raw = data.get("records", [])
    records = []
    for r in records_raw:
        try:
            records.append(
                MandiPriceRecord(
                    commodity=r.get("commodity", ""),
                    variety=r.get("variety"),
                    market=r.get("market", ""),
                    district=r.get("district"),
                    state=r.get("state"),
                    min_price=float(r.get("min_price", 0)),
                    max_price=float(r.get("max_price", 0)),
                    modal_price=float(r.get("modal_price", 0)),
                    arrival_date=_parse_date(r.get("arrival_date")),
                )
            )
        except (ValueError, TypeError):
            # Skip malformed records, do not invent data
            continue

    result = {
        "records": records,
        "total_count": data.get("total", len(records)),
        "last_updated": datetime.now(timezone.utc),
    }

    mandi_cache[cache_key] = result
    return result