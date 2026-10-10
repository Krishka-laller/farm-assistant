"""Pydantic models for all API request/response schemas and error shapes."""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# -- Enums --

class LanguageCode(str, Enum):
    en = "en"
    hi = "hi"
    pa = "pa"
    mr = "mr"
    gu = "gu"
    ta = "ta"
    te = "te"
    bn = "bn"


class SoilType(str, Enum):
    alluvial = "alluvial"
    black_cotton = "black_cotton"
    red = "red"
    laterite = "laterite"
    sandy = "sandy"
    clayey = "clayey"
    loamy = "loamy"
    saline = "saline"


class Season(str, Enum):
    kharif = "kharif"
    rabi = "rabi"
    zaid = "zaid"


class WaterAvailability(str, Enum):
    irrigated = "irrigated"
    rainfed = "rainfed"
    limited = "limited"


class Confidence(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class AdviceCategory(str, Enum):
    sowing = "sowing"
    irrigation = "irrigation"
    spraying = "spraying"
    harvesting = "harvesting"
    general = "general"


class Urgency(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


# -- Chat --

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    lang: LanguageCode
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    location: Optional[dict] = Field(
        default=None,
        description="Optional {lat, lon} for contextual answers",
    )


class ChatResponse(BaseModel):
    reply: str
    lang: LanguageCode
    disclaimer: str
    sources: list[str] = Field(default_factory=list)


# -- Crop Recommendation --

class CropRecommendRequest(BaseModel):
    lat: float = Field(..., ge=6.0, le=37.0)
    lon: float = Field(..., ge=68.0, le=97.5)
    soil_type: SoilType
    season: Season
    water_availability: WaterAvailability
    lang: LanguageCode


class CropRecommendation(BaseModel):
    crop_name: str
    suitability_score: float = Field(..., ge=0, le=1)
    reasoning: str
    expected_duration_days: Optional[int] = None
    water_requirement: Optional[str] = None


class CropRecommendResponse(BaseModel):
    recommendations: list[CropRecommendation] = Field(default_factory=list, max_length=5)
    lang: LanguageCode
    disclaimer: str
    weather_summary: Optional[str] = None


# -- Disease Identification --

class TreatmentStep(BaseModel):
    step_number: int
    instruction: str
    safety_warning: Optional[str] = None


class DiseaseIdentifyResponse(BaseModel):
    identified: bool
    disease_name: Optional[str] = None
    confidence: Optional[Confidence] = None
    description: Optional[str] = None
    treatment_steps: list[TreatmentStep] = Field(default_factory=list)
    prevention_tips: list[str] = Field(default_factory=list)
    refer_to_expert: bool = False
    lang: LanguageCode
    disclaimer: str


# -- Weather --

class DailyForecast(BaseModel):
    date: date
    temp_max_c: float
    temp_min_c: float
    precipitation_mm: float
    humidity_percent: float
    wind_speed_kmh: Optional[float] = None
    weather_code: Optional[int] = None
    weather_description: Optional[str] = None


class FarmingAdvice(BaseModel):
    category: AdviceCategory
    advice: str
    urgency: Optional[Urgency] = None


class CurrentWeather(BaseModel):
    temp_c: float
    humidity_percent: float
    precipitation_mm: float
    wind_speed_kmh: Optional[float] = None
    weather_description: Optional[str] = None


class WeatherResponse(BaseModel):
    current: CurrentWeather
    forecast: list[DailyForecast] = Field(default_factory=list, max_length=7)
    farming_advice: list[FarmingAdvice] = Field(default_factory=list)
    source: str = "Open-Meteo"
    last_updated: datetime
    lang: LanguageCode
    disclaimer: str


# -- Mandi Prices --

class MandiPriceRecord(BaseModel):
    commodity: str
    variety: Optional[str] = None
    market: str
    district: Optional[str] = None
    state: Optional[str] = None
    min_price: float
    max_price: float
    modal_price: float
    arrival_date: Optional[date] = None


class MandiPriceResponse(BaseModel):
    records: list[MandiPriceRecord] = Field(default_factory=list)
    total_count: int = 0
    source: str = "Agmarknet, data.gov.in"
    last_updated: datetime
    lang: LanguageCode


# -- Fertilizer Guidance --

class FertilizerGuideRequest(BaseModel):
    crop_name: str = Field(..., min_length=1, max_length=100)
    soil_type: Optional[SoilType] = None
    issue_description: str = Field(..., min_length=1, max_length=1000)
    lang: LanguageCode


class FertilizerGuidance(BaseModel):
    guidance_type: str
    general_advice: str
    safety_practices: list[str] = Field(default_factory=list)
    application_timing: Optional[str] = None


class FertilizerGuideResponse(BaseModel):
    recommendations: list[FertilizerGuidance] = Field(default_factory=list)
    general_advice: str
    refer_to_expert: bool = True
    lang: LanguageCode
    disclaimer: str


# -- Location --

class StateInfo(BaseModel):
    name: str
    code: str
    districts: list[str]


class GeocodingResult(BaseModel):
    lat: float
    lon: float
    name: str
    state: Optional[str] = None
    country: str = "India"
