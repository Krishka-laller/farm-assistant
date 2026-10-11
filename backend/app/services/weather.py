"""Open-Meteo weather API client.

Uses the free Open-Meteo API (no key required) to fetch current conditions
and 7-day forecast for Indian coordinates.
"""

import logging
from datetime import datetime, timezone

import httpx

from app.models.errors import ServiceUnavailableError
from app.models.schemas import CurrentWeather, DailyForecast

logger = logging.getLogger(__name__)

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"
TIMEOUT_SECONDS = 10

# WMO weather interpretation codes to descriptions
WMO_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}

_UNAVAILABLE_MESSAGE = "Weather data is temporarily unavailable. Please try again later."


def _daily_value(daily_data: dict, key: str, index: int, default=None):
    values = daily_data.get(key) or []
    if index < len(values) and values[index] is not None:
        return values[index]
    return default


async def fetch_weather(lat: float, lon: float) -> dict:
    """Fetch current weather and 7-day forecast from Open-Meteo.

    Returns raw structured data. The route handler adds farming advice.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max,weather_code",
        "timezone": "Asia/Kolkata",
        "forecast_days": 7,
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.get(OPEN_METEO_BASE, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        # Open-Meteo explains errors in a short JSON "reason". No user data in it.
        reason = exc.response.text[:200].replace("\n", " ")
        logger.error("Weather API failed: HTTP %s, %s", status, reason)
        raise ServiceUnavailableError(service="Open-Meteo", message=_UNAVAILABLE_MESSAGE)
    except httpx.HTTPError as exc:
        logger.error("Weather API failed: %s", type(exc).__name__)
        raise ServiceUnavailableError(service="Open-Meteo", message=_UNAVAILABLE_MESSAGE)
    except ValueError:
        logger.error("Weather API failed: invalid JSON")
        raise ServiceUnavailableError(service="Open-Meteo", message=_UNAVAILABLE_MESSAGE)

    # Parse current weather
    current_data = data.get("current", {})
    current = CurrentWeather(
        temp_c=current_data.get("temperature_2m", 0),
        humidity_percent=current_data.get("relative_humidity_2m", 0),
        precipitation_mm=current_data.get("precipitation", 0),
        wind_speed_kmh=current_data.get("wind_speed_10m"),
        weather_description=WMO_CODES.get(
            current_data.get("weather_code", 0), "Unknown"
        ),
    )

    # Parse daily forecast
    daily_data = data.get("daily", {})
    forecast = []
    dates = daily_data.get("time", [])
    for i, date_str in enumerate(dates):
        weather_code = _daily_value(daily_data, "weather_code", i)
        forecast.append(
            DailyForecast(
                date=date_str,
                temp_max_c=_daily_value(daily_data, "temperature_2m_max", i, 0),
                temp_min_c=_daily_value(daily_data, "temperature_2m_min", i, 0),
                precipitation_mm=_daily_value(daily_data, "precipitation_sum", i, 0),
                humidity_percent=_daily_value(daily_data, "relative_humidity_2m_mean", i, 0),
                wind_speed_kmh=_daily_value(daily_data, "wind_speed_10m_max", i),
                weather_code=weather_code,
                weather_description=WMO_CODES.get(weather_code, "Unknown") if weather_code is not None else None,
            )
        )

    return {
        "current": current,
        "forecast": forecast,
        "last_updated": datetime.now(timezone.utc),
    }