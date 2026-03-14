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
    total_matches = await db.matches.count_documents({})
    pending_verification = await db.matches.count_documents({"verified": False})
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
    query = {}
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
        if match.get("sighting_id"):
            sighting = await db.sightings.find_one({"_id": ObjectId(match["sighting_id"])})
            if sighting:
                match["sighting_location"] = sighting.get("location")
                match["sighting_image"] = sighting.get("image_path")
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
