"""Image validation, EXIF stripping, and resize service.

Validates uploaded images via magic bytes (not Content-Type header),
strips all EXIF metadata for privacy, and resizes to a max dimension
for Gemini Vision input.
"""

import io

from PIL import Image

from app.config import get_settings
from app.models.errors import ImageTooLargeError, InvalidImageTypeError

MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
}

MAX_DIMENSION = 1024


def validate_magic_bytes(content: bytes) -> str:
    """Check actual file type via magic bytes. Returns detected MIME type."""
    header = content[:8]
    for magic, mime_type in MAGIC_BYTES.items():
        if header.startswith(magic):
            return mime_type
    raise InvalidImageTypeError()


def validate_size(content: bytes) -> None:
    """Enforce maximum file size."""
    settings = get_settings()
    if len(content) > settings.max_image_size_bytes:
        raise ImageTooLargeError(settings.max_image_size_mb)


def strip_exif_and_resize(content: bytes, detected_type: str) -> bytes:
    """Strip EXIF metadata (including GPS) and resize if larger than MAX_DIMENSION.

    Creates a new image from pixel data only, discarding all metadata.
    """
    img = Image.open(io.BytesIO(content))

    # Convert to RGB if needed (handles RGBA PNGs, palette images)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Strip EXIF by creating a new image from raw pixel data
    data = list(img.getdata())
    clean_img = Image.new(img.mode, img.size)
    clean_img.putdata(data)

    # Resize if exceeds max dimension
    if max(clean_img.size) > MAX_DIMENSION:
        clean_img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    # Save to bytes
    buf = io.BytesIO()
    fmt = "JPEG" if detected_type == "image/jpeg" else "PNG"
    save_kwargs = {"format": fmt}
    if fmt == "JPEG":
        save_kwargs["quality"] = 85
    clean_img.save(buf, **save_kwargs)
    return buf.getvalue()


async def process_upload(content: bytes) -> tuple[bytes, str]:
    """Full upload processing pipeline: validate, strip EXIF, resize.

    Returns (processed_bytes, mime_type).
    """
    validate_size(content)
    detected_type = validate_magic_bytes(content)
    processed = strip_exif_and_resize(content, detected_type)
    return processed, detected_type
