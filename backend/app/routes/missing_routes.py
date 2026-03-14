"""
missing_routes.py
Report a missing person and retrieve the list of missing persons.
"""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, status

from app.database import get_db
from app.utils.security import get_current_user
from app.utils.image_upload import save_upload
from app.services.encoding_service import process_image_file
from app.services.face_service import FACE_RECOGNITION_AVAILABLE
from app.config import MISSING_PERSONS_DIR, to_public_upload_path

router = APIRouter(prefix="/api", tags=["missing-persons"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    if "reported_by" in doc and isinstance(doc["reported_by"], ObjectId):
        doc["reported_by"] = str(doc["reported_by"])
    doc["photo_url"] = to_public_upload_path(doc.get("photo_path"))
    doc.pop("face_encoding", None)  # Never expose raw encodings to clients
    return doc


@router.post("/report-missing", status_code=status.HTTP_201_CREATED)
async def report_missing(
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    last_seen_location: str = Form(...),
    last_seen_date: str = Form(...),
    description: str = Form(""),
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()

    # Save the uploaded photo
    photo_path = await save_upload(photo, MISSING_PERSONS_DIR)

    # Generate face encoding
    encoding = process_image_file(photo_path)
    face_detected = encoding is not None

    doc = {
        "name": name,
        "age": age,
        "gender": gender,
        "last_seen_location": last_seen_location,
        "last_seen_date": last_seen_date,
        "description": description,
        "photo_path": photo_path,
        "face_encoding": encoding,
        "reported_by": ObjectId(str(current_user["_id"])),
        "status": "missing",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.missing_persons.insert_one(doc)

    return {
        "message": (
            "Missing person report submitted successfully and face encoding was generated."
            if face_detected
            else (
                "Missing person report submitted, but AI face encoding is currently unavailable on the server."
                if not FACE_RECOGNITION_AVAILABLE
                else "Missing person report submitted, but no clear face was detected. Please upload a frontal face image to improve AI matching."
            )
        ),
        "person_id": str(result.inserted_id),
        "face_detected": face_detected,
        "face_recognition_available": FACE_RECOGNITION_AVAILABLE,
    }


@router.get("/missing-persons")
async def list_missing_persons(
    skip: int = 0,
    limit: int = 20,
    status_filter: str = "missing",
):
    db = get_db()
    query = {}
    if status_filter in ("missing", "found"):
        query["status"] = status_filter

    cursor = db.missing_persons.find(query).skip(skip).limit(limit).sort("created_at", -1)
    persons = [_serialize(doc) async for doc in cursor]
    total = await db.missing_persons.count_documents(query)
    return {"total": total, "results": persons}


@router.get("/missing-persons/{person_id}")
async def get_missing_person(person_id: str):
    db = get_db()
    try:
        oid = ObjectId(person_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid person ID.")

    doc = await db.missing_persons.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found.")
    return _serialize(doc)


@router.patch("/missing-persons/{person_id}/status")
async def update_person_status(
    person_id: str,
    new_status: str,
    current_user: dict = Depends(get_current_user),
):
    if new_status not in ("missing", "found"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be 'missing' or 'found'.")

    db = get_db()
    try:
        oid = ObjectId(person_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid person ID.")

    result = await db.missing_persons.update_one(
        {"_id": oid},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found.")

    return {"message": f"Status updated to '{new_status}'."}


@router.get("/my-reports")
async def my_reports(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.missing_persons.find({"reported_by": current_user["_id"]}).sort("created_at", -1)
    return [_serialize(doc) async for doc in cursor]
