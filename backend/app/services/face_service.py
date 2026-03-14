"""
face_service.py
Low-level face detection and encoding helpers.

Primary backend : face_recognition library (requires dlib).
Fallback backend: OpenCV Haar-cascade detector only (no encoding/matching).

The server starts and the webcam feed works regardless of whether dlib/face_recognition
is installed.  Encoding and matching operations return None when the library is missing.
"""
from typing import Optional

import cv2
import numpy as np
from PIL import Image, ImageOps

# ---------------------------------------------------------------------------
# Try to import face_recognition (needs dlib).  Graceful degradation if absent.
# ---------------------------------------------------------------------------
try:
    import face_recognition as _fr
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    _fr = None
    FACE_RECOGNITION_AVAILABLE = False
    print(
        "[face_service] WARNING: 'face_recognition' library not found. "
        "Face encoding and matching are disabled. "
        "Install dlib + face-recognition to enable AI matching."
    )

def _load_cascade(prefer_lbp: bool = False) -> cv2.CascadeClassifier:
    """Load preferred OpenCV cascade with graceful fallback to Haar."""
    lbp_path = cv2.data.haarcascades + "lbpcascade_frontalface.xml"
    haar_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

    primary = lbp_path if prefer_lbp else haar_path
    fallback = haar_path if prefer_lbp else lbp_path

    cascade = cv2.CascadeClassifier(primary)
    if cascade.empty():
        cascade = cv2.CascadeClassifier(fallback)
    return cascade


# ---------------------------------------------------------------------------
# Image loading helpers
# ---------------------------------------------------------------------------

def load_image_from_path(image_path: str) -> Optional[np.ndarray]:
    """Load an image from disk and return it as an RGB numpy array."""
    try:
        with Image.open(image_path) as img:
            # Many mobile photos store orientation in EXIF instead of pixels.
            fixed = ImageOps.exif_transpose(img).convert("RGB")
            return np.array(fixed)
    except Exception:
        # Fallback to OpenCV decode path.
        bgr = cv2.imread(image_path)
        if bgr is None:
            return None
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def load_image_from_bytes(data: bytes) -> Optional[np.ndarray]:
    """Decode raw image bytes into an RGB numpy array."""
    try:
        from io import BytesIO

        with Image.open(BytesIO(data)) as img:
            fixed = ImageOps.exif_transpose(img).convert("RGB")
            return np.array(fixed)
    except Exception:
        arr = np.frombuffer(data, dtype=np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None:
            return None
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


# ---------------------------------------------------------------------------
# Face detection
# ---------------------------------------------------------------------------

def detect_faces_opencv(
    image: np.ndarray,
    process_width: int = 480,
    prefer_lbp: bool = False,
    scale_factor: float = 1.2,
    min_neighbors: int = 5,
    min_size: tuple[int, int] = (60, 60),
) -> list[tuple[int, int, int, int]]:
    """
    Fast OpenCV face detection with frame downscaling.

    Input image must be RGB. Returned boxes are in original resolution as
    (top, right, bottom, left).
    """
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    h, w = gray.shape[:2]
    if w == 0 or h == 0:
        return []

    scale = 1.0
    small = gray
    if process_width > 0 and w > process_width:
        scale = process_width / float(w)
        new_h = max(1, int(h * scale))
        small = cv2.resize(gray, (process_width, new_h), interpolation=cv2.INTER_LINEAR)

    cascade = _load_cascade(prefer_lbp=prefer_lbp)
    rects = cascade.detectMultiScale(
        small,
        scaleFactor=scale_factor,
        minNeighbors=min_neighbors,
        minSize=min_size,
    )

    if len(rects) == 0:
        return []

    inv_scale = 1.0 / scale
    locations: list[tuple[int, int, int, int]] = []
    for (x, y, rw, rh) in rects:
        left = int(x * inv_scale)
        top = int(y * inv_scale)
        right = int((x + rw) * inv_scale)
        bottom = int((y + rh) * inv_scale)
        locations.append((top, right, bottom, left))
    return locations


def detect_face(image: np.ndarray) -> list:
    """
    Detect face locations in an RGB image.
    Returns a list of (top, right, bottom, left) tuples.

    Uses face_recognition HOG model when available, otherwise falls back to
    OpenCV Haar cascade.
    """
    if FACE_RECOGNITION_AVAILABLE:
        return _fr.face_locations(image, model="hog")

    return detect_faces_opencv(
        image,
        process_width=480,
        prefer_lbp=False,
        scale_factor=1.2,
        min_neighbors=5,
        min_size=(60, 60),
    )


# ---------------------------------------------------------------------------
# Face encoding
# ---------------------------------------------------------------------------

def generate_encoding(image: np.ndarray) -> Optional[list]:
    """
    Generate a 128-d face encoding for the first face found in the image.
    Returns None if face_recognition is unavailable or no face is detected.
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return None

    # Retry with higher upsampling for faces that appear small in-frame.
    locations = []
    for upsample in (1, 2):
        locations = _fr.face_locations(image, number_of_times_to_upsample=upsample, model="hog")
        if locations:
            break

    if not locations:
        return None

    encodings = _fr.face_encodings(image, known_face_locations=locations)
    if not encodings:
        return None
    return encodings[0].tolist()  # plain list for MongoDB storage


def generate_all_encodings(image: np.ndarray) -> list:
    """
    Detect every face in an RGB image and return an encoding for each one.

    Returns a list of (location, encoding) tuples where:
        location = (top, right, bottom, left)
        encoding = list of 128 floats (ready for MongoDB storage)

    Returns an empty list when face_recognition is unavailable or no faces
    are detected.
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return []

    locations = []
    for upsample in (1, 2):
        locations = _fr.face_locations(image, number_of_times_to_upsample=upsample, model="hog")
        if locations:
            break

    if not locations:
        return []

    encodings = _fr.face_encodings(image, known_face_locations=locations)
    return [(loc, enc.tolist()) for loc, enc in zip(locations, encodings)]


# ---------------------------------------------------------------------------
# Face comparison
# ---------------------------------------------------------------------------

def compare_faces(
    known_encoding: list,
    candidate_encoding: list,
    threshold: float = 0.5,
) -> tuple[bool, float]:
    """
    Compare two face encodings.
    Returns (is_match: bool, confidence: float).
    confidence is threshold-relative: (threshold - distance) / threshold,
    so distance=0 → 1.0, distance=threshold → 0.0. Returns (False, 0.0)
    if face_recognition is unavailable or encodings are invalid.
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return False, 0.0

    known_np = np.array(known_encoding, dtype=np.float64)
    candidate_np = np.array(candidate_encoding, dtype=np.float64)

    # Reject malformed or zero-vector encodings to prevent false 100% matches.
    if known_np.shape != (128,) or candidate_np.shape != (128,):
        return False, 0.0
    if np.linalg.norm(known_np) < 1e-6 or np.linalg.norm(candidate_np) < 1e-6:
        return False, 0.0

    distance = float(_fr.face_distance([known_np], candidate_np)[0])
    is_match = bool(distance < threshold)
    # Confidence: how far below the threshold is the distance (0.0–1.0 scale).
    confidence = float(max(0.0, (threshold - distance) / threshold))
    return is_match, confidence
