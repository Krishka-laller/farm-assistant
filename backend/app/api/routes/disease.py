"""Disease identification endpoint: leaf photo upload and analysis."""

from fastapi import APIRouter, File, Form, Request, UploadFile

from app.middleware.rate_limit import limiter
from app.config import get_settings
from app.models.schemas import DiseaseIdentifyResponse, LanguageCode
from app.models.errors import ApiError
from app.services.disease import identify_disease as run_disease_identification
from app.services.gemini import get_disclaimer

router = APIRouter(prefix="/api/disease", tags=["Disease"])


@router.post(
    "/identify",
    response_model=DiseaseIdentifyResponse,
    responses={
        400: {"model": ApiError},
        413: {"model": ApiError},
        429: {"model": ApiError},
        500: {"model": ApiError},
        503: {"model": ApiError},
    },
)
@limiter.limit(get_settings().rate_limit_upload)
async def identify_disease(
    request: Request,
    image: UploadFile = File(..., description="Leaf photo, JPEG or PNG, max 5 MB"),
    lang: LanguageCode = Form(default=LanguageCode.en),
    crop_name: str = Form(default="", max_length=100),
) -> DiseaseIdentifyResponse:
    """Upload a leaf photo to identify disease and get treatment steps.

    Pipeline: validate magic bytes, strip EXIF, resize, send to Gemini Vision.
    If Gemini is uncertain, the response says so explicitly.
    """
    content = await image.read()
    raw = await run_disease_identification(content, lang.value, crop_name.strip() or None)
    return DiseaseIdentifyResponse(
        identified=raw.get("identified", False),
        disease_name=raw.get("disease_name"),
        confidence=raw.get("confidence"),
        description=raw.get("description"),
        treatment_steps=raw.get("treatment_steps", []),
        prevention_tips=raw.get("prevention_tips", []),
        refer_to_expert=raw.get("refer_to_expert", False),
        lang=lang,
        disclaimer=get_disclaimer(lang.value),
    )

