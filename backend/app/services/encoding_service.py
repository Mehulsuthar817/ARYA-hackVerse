"""
encoding_service.py
Helpers for processing uploaded images end-to-end:
  load → detect → encode → return ready-to-store payload.
"""
from typing import Optional

from app.services.face_service import (
    generate_encoding,
    load_image_from_path,
    load_image_from_bytes,
)


def process_image_file(image_path: str) -> Optional[list]:
    """
    Load an image from disk, detect a face, and return its 128-d encoding.
    Returns None if the image cannot be loaded or no face is detected.
    """
    image = load_image_from_path(image_path)
    if image is None:
        return None
    return generate_encoding(image)


def process_image_bytes(data: bytes) -> Optional[list]:
    """
    Process raw image bytes (e.g. a decoded video frame).
    Returns the face encoding or None.
    """
    image = load_image_from_bytes(data)
    if image is None:
        return None
    return generate_encoding(image)
