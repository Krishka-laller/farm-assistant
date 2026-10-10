"""Disease identification service.

Uses the image processing pipeline (validate, strip EXIF, resize)
and Gemini Vision for disease identification. Pillow is NOT used
for classification.
"""

from app.services.image import process_upload
from app.services.gemini import analyze_disease_image


async def identify_disease(
    image_content: bytes,
    lang: str,
    crop_name: str | None = None,
) -> dict:
    """Full disease identification pipeline.

    1. Validate magic bytes, strip EXIF, resize (image service)
    2. Send cleaned image to Gemini Vision (gemini service)
    3. Return structured result with confidence and "I am not sure" path
    """
    processed_bytes, mime_type = await process_upload(image_content)
    result = await analyze_disease_image(processed_bytes, lang, crop_name)
    return result
