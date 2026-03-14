import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

BACKEND_ROOT = os.path.dirname(os.path.dirname(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_ROOT)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "missing_person_ai")

SECRET_KEY = os.getenv("SECRET_KEY", "changeme-in-production-super-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

UPLOAD_DIR = os.path.join(PROJECT_ROOT, "uploads")
MISSING_PERSONS_DIR = os.path.join(UPLOAD_DIR, "missing_persons")
SIGHTINGS_DIR = os.path.join(UPLOAD_DIR, "sightings")
CCTV_FRAMES_DIR = os.path.join(UPLOAD_DIR, "cctv_frames")

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))

FACE_DISTANCE_THRESHOLD = float(os.getenv("FACE_DISTANCE_THRESHOLD", "0.6"))


def to_public_upload_path(file_path: Optional[str]) -> Optional[str]:
	if not file_path:
		return None

	normalized = file_path.replace("\\", "/")
	uploads_marker = "/uploads/"

	if uploads_marker in normalized:
		return normalized[normalized.index(uploads_marker):]

	if normalized.startswith("uploads/"):
		return f"/{normalized}"

	return f"/uploads/{os.path.basename(normalized)}"
