import io
from datetime import datetime, timezone
import pytest
from PIL import Image

from app.models.schemas import (
    CurrentWeather,
    GeocodingResult,
    MandiPriceRecord,
)


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_location_states(client):
    response = client.get("/api/location/states")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "name" in data[0]
    assert "districts" in data[0]


def test_location_geocode(client, monkeypatch):
    async def mock_geocode(district: str, state: str):
        return GeocodingResult(
            lat=30.9010,
            lon=75.8573,
            name=district,
            state=state,
            country="India",
        )

    monkeypatch.setattr("app.api.routes.location.geocode_location", mock_geocode)
    response = client.get("/api/location/geocode", params={"district": "Ludhiana", "state": "Punjab"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Ludhiana"
    assert data["lat"] == 30.9010


def test_weather(client, monkeypatch):
    async def mock_fetch_weather(lat: float, lon: float):
        return {
            "current": CurrentWeather(
                temp_c=28.5,
                humidity_percent=60.0,
                precipitation_mm=0.0,
                wind_speed_kmh=8.0,
                weather_description="Clear sky",
            ),
            "forecast": [],
            "last_updated": datetime.now(timezone.utc),
        }

    monkeypatch.setattr("app.api.routes.weather.fetch_weather", mock_fetch_weather)
    response = client.get("/api/weather", params={"lat": 30.9010, "lon": 75.8573, "lang": "en"})
    assert response.status_code == 200
    data = response.json()
    assert data["current"]["temp_c"] == 28.5
    assert "farming_advice" in data


def test_mandi_prices(client, monkeypatch):
    async def mock_fetch_mandi(state: str, district: str | None = None, commodity: str | None = None):
        return {
            "records": [
                MandiPriceRecord(
                    commodity="Wheat",
                    variety="PBW-343",
                    market="Ludhiana",
                    district="Ludhiana",
                    state="Punjab",
                    min_price=2100.0,
                    max_price=2300.0,
                    modal_price=2200.0,
                    arrival_date="2026-10-08",
                )
            ],
            "total_count": 1,
            "last_updated": datetime.now(timezone.utc),
        }

    monkeypatch.setattr("app.api.routes.mandi.fetch_mandi_prices", mock_fetch_mandi)
    response = client.get(
        "/api/mandi/prices",
        params={"state": "Punjab", "district": "Ludhiana", "commodity": "Wheat", "lang": "en"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["records"]) == 1
    assert data["records"][0]["commodity"] == "Wheat"
    assert data["source"] == "Agmarknet, data.gov.in"


def test_fertilizer_guide(client, monkeypatch):
    async def mock_guide(**kwargs):
        return {
            "recommendations": [],
            "general_advice": "Consult your local Krishi Vigyan Kendra (KVK) for advice.",
            "refer_to_expert": True,
        }

    monkeypatch.setattr("app.api.routes.fertilizer.generate_fertilizer_guidance", mock_guide)
    payload = {
        "crop_name": "Wheat",
        "soil_type": "alluvial",
        "issue_description": "Yellowing leaf tips",
        "lang": "en",
    }
    response = client.post("/api/fertilizer/guide", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "general_advice" in data
    assert data["refer_to_expert"] is True
    assert "KVK" in data["disclaimer"]


def test_crop_recommend(client, monkeypatch):
    async def mock_recs(**kwargs):
        return [
            {
                "crop_name": "Wheat",
                "suitability_score": 0.9,
                "reasoning": "Suitable for rabi season in alluvial soil.",
            }
        ]

    monkeypatch.setattr("app.api.routes.crop.generate_crop_recommendations", mock_recs)
    payload = {
        "lat": 30.9010,
        "lon": 75.8573,
        "soil_type": "alluvial",
        "season": "rabi",
        "water_availability": "irrigated",
        "lang": "en",
    }
    response = client.post("/api/crop/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert "disclaimer" in data


def test_chat(client, monkeypatch):
    async def mock_chat(**kwargs):
        return "Mustard is typically sown from October to November."

    monkeypatch.setattr("app.api.routes.chat.generate_chat_response", mock_chat)
    payload = {
        "message": "When should I sow mustard?",
        "lang": "en",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "disclaimer" in data


def test_disease_identify(client, monkeypatch):
    async def mock_disease(content, lang, crop_name):
        return {
            "identified": True,
            "disease_name": "Yellow Rust",
            "confidence": "high",
            "description": "Fungal infection affecting leaves.",
            "treatment_steps": [
                {
                    "step_number": 1,
                    "instruction": "Spray appropriate fungicide as per KVK advice.",
                    "safety_warning": "Wear protective gear.",
                }
            ],
            "prevention_tips": ["Use resistant varieties."],
            "refer_to_expert": True,
        }

    monkeypatch.setattr("app.api.routes.disease.run_disease_identification", mock_disease)
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color="green")
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("leaf.jpg", buf.getvalue(), "image/jpeg")}
    data = {"crop_name": "Wheat", "lang": "en"}
    response = client.post("/api/disease/identify", files=files, data=data)
    assert response.status_code == 200
    res_json = response.json()
    assert "identified" in res_json
    assert res_json["refer_to_expert"] is True
