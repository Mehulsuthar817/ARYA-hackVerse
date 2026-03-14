"""
sightings_routes.py
Upload a sighting image, run facial recognition against the missing-persons
database, and store any matches found.
"""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, Form, File, UploadFile, status

from app.database import get_db
from app.utils.security import get_current_user
from app.utils.image_upload import save_upload
from app.services.face_service import FACE_RECOGNITION_AVAILABLE, generate_all_encodings, load_image_from_path
from app.services.match_service import find_matches, store_match
from app.config import SIGHTINGS_DIR, to_public_upload_path

router = APIRouter(prefix="/api", tags=["sightings"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    for field in ("uploaded_by", "match_person_id"):
        if field in doc and isinstance(doc[field], ObjectId):
            doc[field] = str(doc[field])
    doc["image_url"] = to_public_upload_path(doc.get("image_path"))
    return doc


@router.post("/report-sighting", status_code=status.HTTP_201_CREATED)
async def report_sighting(
    location: str = Form(...),
    description: str = Form(""),
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()

    image_path = await save_upload(photo, SIGHTINGS_DIR)

    # Detect every face in the uploaded photo
    image = load_image_from_path(image_path)
    face_encodings = generate_all_encodings(image) if image is not None else []

    sighting_doc = {
        "image_path": image_path,
        "location": location,
        "description": description,
        "uploaded_by": ObjectId(str(current_user["_id"])),
        "timestamp": datetime.now(timezone.utc),
        "match_person_id": None,
        "confidence_score": None,
    }
    result = await db.sightings.insert_one(sighting_doc)
    sighting_id = str(result.inserted_id)

    if not face_encodings:
        return {
            "message": (
                "Sighting recorded, but AI face encoding is currently unavailable on the server."
                if not FACE_RECOGNITION_AVAILABLE
                else "Sighting recorded. No face detected in the image."
            ),
            "sighting_id": sighting_id,
            "face_detected": False,
            "face_recognition_available": FACE_RECOGNITION_AVAILABLE,
            "matches": [],
        }

    # Match every face found in the photo against all missing persons
    all_matches: list[dict] = []
    for _loc, enc in face_encodings:
        face_matches = await find_matches(enc, db)
        all_matches.extend(face_matches)

    # Deduplicate by person_id — keep the highest-confidence match per person
    seen: dict[str, dict] = {}
    for m in all_matches:
        pid = m["person_id"]
        if pid not in seen or m["confidence"] > seen[pid]["confidence"]:
            seen[pid] = m
    deduped_matches = sorted(seen.values(), key=lambda x: x["confidence"], reverse=True)

    best_match = None
    for match in deduped_matches:
        await store_match(match["person_id"], sighting_id, match["confidence"], db)
        if best_match is None:
            best_match = match

    # Update sighting with top match details
    if best_match:
        await db.sightings.update_one(
            {"_id": ObjectId(sighting_id)},
            {
                "$set": {
                    "match_person_id": ObjectId(best_match["person_id"]),
                    "confidence_score": best_match["confidence"],
                }
            },
        )

    return {
        "message": "Sighting recorded and face matching completed.",
        "sighting_id": sighting_id,
        "face_detected": True,
        "faces_in_photo": len(face_encodings),
        "face_recognition_available": FACE_RECOGNITION_AVAILABLE,
        "matches_found": len(deduped_matches),
        "top_matches": deduped_matches[:5],
    }


@router.get("/sightings")
async def list_sightings(skip: int = 0, limit: int = 20):
    db = get_db()
    cursor = db.sightings.find().skip(skip).limit(limit).sort("timestamp", -1)
    docs = [_serialize(doc) async for doc in cursor]
    total = await db.sightings.count_documents({})
    return {"total": total, "results": docs}


@router.get("/my-sightings")
async def my_sightings(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.sightings.find({"uploaded_by": current_user["_id"]}).sort("timestamp", -1)
    return [_serialize(doc) async for doc in cursor]
