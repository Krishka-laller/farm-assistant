"""Open-Meteo weather API client.

Uses the free Open-Meteo API (no key required) to fetch current conditions
and 7-day forecast for Indian coordinates.
"""

import httpx
from datetime import datetime, timezone

from app.models.errors import ServiceUnavailableError
from app.models.schemas import CurrentWeather, DailyForecast

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


async def fetch_weather(lat: float, lon: float) -> dict:
    """Fetch current weather and 7-day forecast from Open-Meteo.

    Returns raw structured data. The route handler adds farming advice
    via the Gemini service.
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
    except (httpx.HTTPError, httpx.TimeoutException):
        raise ServiceUnavailableError(
            service="Open-Meteo",
            message="Weather data is temporarily unavailable. Please try again later.",
        )

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
        weather_code = (daily_data.get("weather_code") or [])[i] if daily_data.get("weather_code") else None
        forecast.append(
            DailyForecast(
                date=date_str,
                temp_max_c=(daily_data.get("temperature_2m_max") or [])[i] if daily_data.get("temperature_2m_max") else 0,
                temp_min_c=(daily_data.get("temperature_2m_min") or [])[i] if daily_data.get("temperature_2m_min") else 0,
                precipitation_mm=(daily_data.get("precipitation_sum") or [])[i] if daily_data.get("precipitation_sum") else 0,
                humidity_percent=(daily_data.get("relative_humidity_2m_mean") or [])[i] if daily_data.get("relative_humidity_2m_mean") else 0,
                wind_speed_kmh=(daily_data.get("wind_speed_10m_max") or [])[i] if daily_data.get("wind_speed_10m_max") else None,
                weather_code=weather_code,
                weather_description=WMO_CODES.get(weather_code, "Unknown") if weather_code is not None else None,
            )
        )

    return {
        "current": current,
        "forecast": forecast,
        "last_updated": datetime.now(timezone.utc),
    }
