"""
match_service.py
Compares a probe encoding against all active missing-person encodings
stored in MongoDB Atlas and returns ranked matches.
"""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId

from app.services.face_service import compare_faces
from app.config import FACE_DISTANCE_THRESHOLD


async def find_matches(
    probe_encoding: list,
    db,
    threshold: float = FACE_DISTANCE_THRESHOLD,
) -> list[dict]:
    """
    Scan every missing person that has a stored face_encoding and return
    a sorted list of matches above the confidence threshold.

    Each result dict contains:
        person_id, name, photo_path, confidence
    """
    results = []
    cursor = db.missing_persons.find(
        {"face_encoding": {"$exists": True, "$ne": None}, "status": "missing"}
    )
    async for person in cursor:
        is_match, confidence = compare_faces(
            person["face_encoding"], probe_encoding, threshold
        )
        if is_match:
            results.append(
                {
                    "person_id": str(person["_id"]),
                    "name": person.get("name", "Unknown"),
                    "photo_path": person.get("photo_path", ""),
                    "confidence": round(confidence, 4),
                }
            )

    # Return best matches first
    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results


async def store_match(
    person_id: str,
    sighting_id: str,
    confidence: float,
    db,
) -> str:
    """Persist a match record and return its inserted _id as a string."""
    doc = {
        "person_id": ObjectId(person_id),
        "sighting_id": ObjectId(sighting_id),
        "confidence": confidence,
        "verified": False,
        "timestamp": datetime.now(timezone.utc),
    }
    result = await db.matches.insert_one(doc)
    return str(result.inserted_id)
