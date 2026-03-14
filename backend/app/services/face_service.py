"""
face_service.py
Low-level face detection and encoding helpers using OpenCV + face_recognition.
"""
from typing import Optional

import cv2
import face_recognition
import numpy as np


def load_image_from_path(image_path: str) -> Optional[np.ndarray]:
    """Load an image from disk and convert BGR → RGB for face_recognition."""
    bgr = cv2.imread(image_path)
    if bgr is None:
        return None
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def load_image_from_bytes(data: bytes) -> Optional[np.ndarray]:
    """Load an image from raw bytes (e.g. from a video frame)."""
    arr = np.frombuffer(data, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        return None
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def detect_face(image: np.ndarray) -> list:
    """
    Detect face locations in an RGB image.
    Returns a list of (top, right, bottom, left) tuples.
    Uses the HOG model for speed; swap to 'cnn' for higher accuracy on GPU.
    """
    return face_recognition.face_locations(image, model="hog")


def generate_encoding(image: np.ndarray) -> Optional[list]:
    """
    Generate a 128-d face encoding for the first face found in the image.
    Returns None if no face is detected.
    """
    locations = detect_face(image)
    if not locations:
        return None
    encodings = face_recognition.face_encodings(image, known_face_locations=locations)
    if not encodings:
        return None
    return encodings[0].tolist()  # Convert numpy array → plain list for MongoDB storage


def compare_faces(
    known_encoding: list,
    candidate_encoding: list,
    threshold: float = 0.6,
) -> tuple[bool, float]:
    """
    Compare two face encodings.
    Returns (is_match: bool, confidence: float).
    confidence = 1 - face_distance  (higher is more similar)
    """
    known_np = np.array(known_encoding)
    candidate_np = np.array(candidate_encoding)
    distance = face_recognition.face_distance([known_np], candidate_np)[0]
    confidence = float(1.0 - distance)
    is_match = bool(distance < threshold)
    return is_match, confidence
