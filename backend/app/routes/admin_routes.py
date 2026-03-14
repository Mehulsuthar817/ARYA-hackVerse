"""
admin_routes.py
Admin-only endpoints: dashboard stats, view AI matches, verify/reject matches.
All endpoints require role == 'admin'.
"""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.database import get_db
from app.utils.security import get_current_admin
from app.config import MIN_PREDICTION_CONFIDENCE, to_public_upload_path
from app.services.face_service import FACE_RECOGNITION_AVAILABLE, generate_all_encodings, load_image_from_path

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    for field in ("person_id", "sighting_id", "reported_by"):
        if field in doc and isinstance(doc[field], ObjectId):
            doc[field] = str(doc[field])
    return doc


# ---------------------------------------------------------------------------
# Dashboard statistics
# ---------------------------------------------------------------------------

@router.get("/dashboard")
async def dashboard(_admin=Depends(get_current_admin)):
    db = get_db()

    total_missing = await db.missing_persons.count_documents({"status": "missing"})
    total_found = await db.missing_persons.count_documents({"status": "found"})
    total_sightings = await db.sightings.count_documents({})
    total_matches = await db.matches.count_documents({"confidence": {"$gte": MIN_PREDICTION_CONFIDENCE}})
    pending_verification = await db.matches.count_documents(
        {"verified": False, "confidence": {"$gte": MIN_PREDICTION_CONFIDENCE}}
    )
    total_users = await db.users.count_documents({"role": "user"})

    return {
        "total_missing": total_missing,
        "total_found": total_found,
        "total_sightings": total_sightings,
        "total_matches": total_matches,
        "pending_verification": pending_verification,
        "total_users": total_users,
    }


# ---------------------------------------------------------------------------
# Matches
# ---------------------------------------------------------------------------

@router.get("/matches")
async def list_matches(
    verified: bool = None,
    skip: int = 0,
    limit: int = 20,
    _admin=Depends(get_current_admin),
):
    db = get_db()
    query = {"confidence": {"$gte": MIN_PREDICTION_CONFIDENCE}}
    if verified is not None:
        query["verified"] = verified

    cursor = db.matches.find(query).skip(skip).limit(limit).sort("timestamp", -1)
    matches = []
    async for doc in cursor:
        match = _serialize(doc)
        # Enrich with person and sighting details
        if match.get("person_id"):
            person = await db.missing_persons.find_one({"_id": ObjectId(match["person_id"])})
            if person:
                match["person_name"] = person.get("name")
                match["person_photo"] = person.get("photo_path")
                match["person_photo_url"] = to_public_upload_path(person.get("photo_path"))
        if match.get("sighting_id"):
            sighting = await db.sightings.find_one({"_id": ObjectId(match["sighting_id"])})
            if sighting:
                match["sighting_location"] = sighting.get("location")
                match["sighting_image"] = sighting.get("image_path")
                match["sighting_image_url"] = to_public_upload_path(sighting.get("image_path"))
        matches.append(match)

    total = await db.matches.count_documents(query)
    return {"total": total, "results": matches}


class VerifyPayload(BaseModel):
    verified: bool


@router.put("/verify-match/{match_id}")
async def verify_match(
    match_id: str,
    payload: VerifyPayload,
    _admin=Depends(get_current_admin),
):
    db = get_db()
    try:
        oid = ObjectId(match_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid match ID.")

    result = await db.matches.update_one(
        {"_id": oid},
        {"$set": {"verified": payload.verified, "verified_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    # If verified, mark the missing person as found
    if payload.verified:
        match_doc = await db.matches.find_one({"_id": oid})
        if match_doc:
            await db.missing_persons.update_one(
                {"_id": match_doc["person_id"]},
                {"$set": {"status": "found", "found_at": datetime.now(timezone.utc)}},
            )

    action = "verified" if payload.verified else "rejected"
    return {"message": f"Match {action} successfully."}


@router.delete("/matches/{match_id}")
async def delete_match(match_id: str, _admin=Depends(get_current_admin)):
    db = get_db()
    try:
        oid = ObjectId(match_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid match ID.")

    result = await db.matches.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    return {"message": "Match record deleted successfully."}


# ---------------------------------------------------------------------------
# Users management
# ---------------------------------------------------------------------------

@router.get("/users")
async def list_users(skip: int = 0, limit: int = 50, _admin=Depends(get_current_admin)):
    db = get_db()
    cursor = db.users.find({}, {"password_hash": 0}).skip(skip).limit(limit)
    users = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        users.append(doc)
    total = await db.users.count_documents({})
    return {"total": total, "results": users}


# ---------------------------------------------------------------------------
# Re-encode missing persons that have no face encoding stored
# ---------------------------------------------------------------------------

@router.post("/reencoder")
async def reencoder(_admin=Depends(get_current_admin)):
    """
    Scan all missing persons whose face_encoding is None and try to generate
    encodings from their stored photo. Useful when face_recognition was
    unavailable at report time and has since been installed.
    Returns: how many were successfully encoded vs how many still failed.
    """
    if not FACE_RECOGNITION_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="face_recognition library is not installed on the server.",
        )

    db = get_db()
    cursor = db.missing_persons.find(
        {"$or": [{"face_encoding": None}, {"face_encoding": {"$exists": False}}]}
    )

    encoded = 0
    failed = 0
    async for person in cursor:
        photo_path = person.get("photo_path")
        if not photo_path:
            failed += 1
            continue
        image = load_image_from_path(photo_path)
        if image is None:
            failed += 1
            continue
        faces = generate_all_encodings(image)
        if not faces:
            failed += 1
            continue
        # Use the first (largest/most prominent) face found
        _loc, encoding = faces[0]
        await db.missing_persons.update_one(
            {"_id": person["_id"]},
            {"$set": {"face_encoding": encoding}},
        )
        encoded += 1

    return {
        "message": f"Re-encoding complete. {encoded} succeeded, {failed} failed (no face detected or photo missing).",
        "encoded": encoded,
        "failed": failed,
    }
