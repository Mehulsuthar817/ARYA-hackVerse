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
from app.services.encoding_service import process_image_file
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

    probe_encoding = process_image_file(image_path)

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

    if probe_encoding is None:
        return {
            "message": "Sighting recorded. No face detected in the image.",
            "sighting_id": sighting_id,
            "face_detected": False,
            "matches": [],
        }

    # Compare against all missing persons
    matches = await find_matches(probe_encoding, db)

    stored_match_ids = []
    best_match = None

    for match in matches:
        match_id = await store_match(match["person_id"], sighting_id, match["confidence"], db)
        stored_match_ids.append(match_id)
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
        "matches_found": len(matches),
        "top_matches": matches[:5],  # Return top 5 to the caller
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
