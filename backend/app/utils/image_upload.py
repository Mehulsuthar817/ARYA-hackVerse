import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import ALLOWED_IMAGE_EXTENSIONS, MAX_FILE_SIZE_MB

MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def _validate_image(file: UploadFile) -> None:
    """Validate file extension and content-type to prevent malicious uploads."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}",
        )
    # Some browsers/devices send variants like image/jpg or application/octet-stream.
    # Accept generic image/* plus octet-stream if extension already passed validation.
    content_type = (file.content_type or "").lower()
    allowed_mime = {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/bmp",
        "image/webp",
        "application/octet-stream",
    }
    if content_type and not content_type.startswith("image/") and content_type not in allowed_mime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image content type. Please upload a JPG, PNG, BMP, or WEBP image.",
        )


async def save_upload(file: UploadFile, destination_dir: str) -> str:
    """
    Validate and save an uploaded image file.
    Returns the saved file path (relative to uploads dir).
    """
    _validate_image(file)

    os.makedirs(destination_dir, exist_ok=True)

    ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(destination_dir, unique_filename)

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed {MAX_FILE_SIZE_MB} MB.",
        )

    with open(file_path, "wb") as f:
        f.write(content)

    return file_path
