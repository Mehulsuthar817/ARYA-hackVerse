"""
cctv_routes.py
CCTV frame processing and stream management.

POST /api/cctv/process-frame    — Accepts a raw JPEG/PNG frame, runs face matching.
POST /api/cctv/start-stream     — Starts a background thread that pulls frames
                                  from an RTSP/video URL and processes them.
GET  /api/cctv/webcam-feed      — MJPEG live stream from a connected camera
                                  (default: laptop webcam, device index 0).
                                  Open in browser or use as <img src=...> in frontend.
GET  /api/cctv/webcam-snapshot  — Single JPEG snapshot from webcam (no auth needed for preview).
"""
import asyncio
import os
import threading
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

import cv2
import numpy as np
from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.database import get_db
from app.utils.security import get_current_admin
from app.utils.image_upload import save_upload
from app.services.face_service import generate_encoding, generate_all_encodings, load_image_from_bytes, detect_face, FACE_RECOGNITION_AVAILABLE
from app.services.match_service import find_matches, store_match
from app.config import CCTV_FRAMES_DIR

router = APIRouter(prefix="/api/cctv", tags=["cctv"])

# Track active stream tasks  {stream_id: threading.Event}
_active_streams: dict[str, threading.Event] = {}

# How many matching cycles before the same person_id can be saved again from
# the live webcam feed (prevents flooding the DB with duplicate records).
_WEBCAM_SAVE_COOLDOWN_CYCLES = 60


# ---------------------------------------------------------------------------
# Laptop / USB webcam live MJPEG feed
# ---------------------------------------------------------------------------

def _draw_boxes_and_labels(frame: np.ndarray, face_results: list) -> np.ndarray:
    """
    Draw bounding boxes with name + confidence for each detected face.

    face_results: list of ((top, right, bottom, left), matches) where
        matches is a list of match dicts sorted by confidence (may be empty).
    """
    for (top, right, bottom, left), matches in face_results:
        if matches:
            best = matches[0]
            label = f"{best['name']} {best['confidence']*100:.1f}%"
            color = (0, 255, 0)
        else:
            label = ""
            color = (0, 165, 255)
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        if label:
            cv2.putText(frame, label, (left, top - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
    return frame


async def _webcam_frame_generator(
    camera_index: int,
    run_matching: bool,
    match_every_n: int,
) -> AsyncGenerator[bytes, None]:
    """
    Async generator that yields MJPEG boundary chunks indefinitely.
    Runs OpenCV capture in a thread to avoid blocking the event loop.
    """
    loop = asyncio.get_event_loop()

    cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)  # CAP_DSHOW is faster on Windows
    if not cap.isOpened():
        cap = cv2.VideoCapture(camera_index)              # Fallback without backend hint
    if not cap.isOpened():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Cannot open camera at index {camera_index}. Make sure it is connected and not in use.",
        )

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    frame_count = 0
    cached_face_results: list = []  # list of ((top,right,bottom,left), matches)
    # Tracks the matching-cycle number when a person was last persisted.
    last_saved_cycle: dict[str, int] = {}
    matching_cycle = 0

    try:
        while True:
            # Read frame in thread pool to avoid blocking async loop
            ret, frame = await loop.run_in_executor(None, cap.read)
            if not ret:
                break

            frame_count += 1

            # Run face matching every N frames to keep stream smooth
            if run_matching and frame_count % match_every_n == 0:
                matching_cycle += 1
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                face_encodings = await loop.run_in_executor(None, generate_all_encodings, rgb)
                if face_encodings:
                    db = get_db()
                    if db is not None:
                        new_results = []
                        for loc, enc in face_encodings:
                            matches = await find_matches(enc, db)
                            new_results.append((loc, matches))
                        cached_face_results = new_results

                        # ── Persist new matches to MongoDB ──────────────────
                        # Save the raw frame once per cycle (shared by all faces).
                        frame_saved_path = None
                        for _loc, face_matches in new_results:
                            for match in face_matches:
                                pid = match["person_id"]
                                last_cycle = last_saved_cycle.get(pid, -_WEBCAM_SAVE_COOLDOWN_CYCLES)
                                if matching_cycle - last_cycle < _WEBCAM_SAVE_COOLDOWN_CYCLES:
                                    continue  # Saved recently — skip
                                if frame_saved_path is None:
                                    os.makedirs(CCTV_FRAMES_DIR, exist_ok=True)
                                    frame_saved_path = os.path.join(
                                        CCTV_FRAMES_DIR,
                                        f"webcam_{uuid.uuid4().hex}.jpg",
                                    )
                                    cv2.imwrite(frame_saved_path, frame)
                                sighting_doc = {
                                    "image_path": frame_saved_path,
                                    "location": f"Live webcam (camera {camera_index})",
                                    "description": "Automated live webcam detection",
                                    "uploaded_by": None,
                                    "timestamp": datetime.now(timezone.utc),
                                    "match_person_id": ObjectId(pid),
                                    "confidence_score": match["confidence"],
                                }
                                sighting_result = await db.sightings.insert_one(sighting_doc)
                                await store_match(
                                    pid,
                                    str(sighting_result.inserted_id),
                                    match["confidence"],
                                    db,
                                )
                                last_saved_cycle[pid] = matching_cycle
                                print(
                                    f"[webcam] Persisted match: {match['name']}  "
                                    f"conf={match['confidence']:.3f}"
                                )
                else:
                    cached_face_results = []

            # Annotate frame with cached per-face results
            if run_matching and cached_face_results:
                frame = _draw_boxes_and_labels(frame, cached_face_results)
            elif run_matching:
                # Draw unlabelled boxes while waiting for first match cycle
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                locations = detect_face(rgb)
                for (top, right, bottom, left) in locations:
                    cv2.rectangle(frame, (left, top), (right, bottom), (0, 165, 255), 2)

            # Encode to JPEG
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            jpg_bytes = buffer.tobytes()

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + jpg_bytes + b"\r\n"
            )

            # ~30 fps cap
            await asyncio.sleep(0.033)
    finally:
        cap.release()


@router.get("/webcam-feed")
async def webcam_feed(
    camera_index: int = 0,
    match: bool = True,
    match_every: int = 15,
):
    """
    Stream live MJPEG video from the laptop/USB camera.

    Query params:
      camera_index  — OpenCV device index (0 = default laptop webcam)
      match         — Whether to run face recognition overlay (default: true)
      match_every   — Run matching every N frames to keep stream smooth (default: 15)

    Usage in browser:   http://localhost:8000/api/cctv/webcam-feed
    Usage in frontend:  <img src="http://localhost:8000/api/cctv/webcam-feed" />
    """
    return StreamingResponse(
        _webcam_frame_generator(camera_index, match, match_every),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/webcam-snapshot")
async def webcam_snapshot(camera_index: int = 0):
    """Return a single JPEG snapshot from the webcam."""
    cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Cannot open camera at index {camera_index}.",
        )
    ret, frame = cap.read()
    cap.release()
    if not ret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to capture frame.")
    _, buffer = cv2.imencode(".jpg", frame)
    return StreamingResponse(iter([buffer.tobytes()]), media_type="image/jpeg")


# ---------------------------------------------------------------------------
# Process a single uploaded frame
# ---------------------------------------------------------------------------

@router.post("/process-frame")
async def process_frame(
    camera_id: str = Form("unknown"),
    frame: UploadFile = File(...),
    _admin=Depends(get_current_admin),
):
    db = get_db()

    frame_path = await save_upload(frame, CCTV_FRAMES_DIR)

    raw = open(frame_path, "rb").read()
    image = load_image_from_bytes(raw)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to decode the uploaded frame.",
        )

    face_encodings = generate_all_encodings(image)
    if not face_encodings:
        return {
            "camera_id": camera_id,
            "faces_detected": 0,
            "matches": [],
            "frame_path": frame_path,
        }

    all_matches: list[dict] = []
    for _loc, encoding in face_encodings:
        matches = await find_matches(encoding, db)
        for match in matches:
            sighting_doc = {
                "image_path": frame_path,
                "location": f"CCTV camera: {camera_id}",
                "description": "Automated CCTV frame detection",
                "uploaded_by": None,
                "timestamp": datetime.now(timezone.utc),
                "match_person_id": ObjectId(match["person_id"]),
                "confidence_score": match["confidence"],
            }
            sighting_result = await db.sightings.insert_one(sighting_doc)
            await store_match(match["person_id"], str(sighting_result.inserted_id), match["confidence"], db)
        all_matches.extend(matches)

    # Deduplicate by person_id, keeping the highest-confidence match
    seen: dict[str, dict] = {}
    for m in all_matches:
        pid = m["person_id"]
        if pid not in seen or m["confidence"] > seen[pid]["confidence"]:
            seen[pid] = m
    top_matches = sorted(seen.values(), key=lambda x: x["confidence"], reverse=True)

    return {
        "camera_id": camera_id,
        "faces_detected": len(face_encodings),
        "matches_found": len(top_matches),
        "top_matches": top_matches[:3],
        "frame_path": frame_path,
    }


# ---------------------------------------------------------------------------
# Background stream processor
# ---------------------------------------------------------------------------

def _stream_worker(stream_url: str, camera_id: str, stop_event: threading.Event, frame_interval: int):
    """
    Pull frames from a video/RTSP stream every `frame_interval` seconds,
    run face detection, and store matches.  Runs in a daemon thread.
    """
    import asyncio
    import time
    from app.database import get_db
    from app.services.face_service import generate_all_encodings
    from app.services.match_service import find_matches, store_match
    from app.config import CCTV_FRAMES_DIR
    import os, uuid

    cap = cv2.VideoCapture(stream_url)
    if not cap.isOpened():
        print(f"[CCTV] Cannot open stream: {stream_url}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    skip_frames = max(1, int(fps * frame_interval))
    frame_count = 0

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    print(f"[CCTV] Stream started: camera={camera_id}  url={stream_url}")

    while not stop_event.is_set():
        ret, bgr_frame = cap.read()
        if not ret:
            break

        frame_count += 1
        if frame_count % skip_frames != 0:
            continue

        # Detect and encode every face in this frame independently
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        face_encodings = generate_all_encodings(rgb_frame)
        if not face_encodings:
            continue

        # Save the frame
        os.makedirs(CCTV_FRAMES_DIR, exist_ok=True)
        filename = os.path.join(CCTV_FRAMES_DIR, f"{camera_id}_{uuid.uuid4().hex}.jpg")
        cv2.imwrite(filename, bgr_frame)

        async def _persist_all(encodings, fpath):
            db = get_db()
            for _loc, enc in encodings:
                matches = await find_matches(enc, db)
                for m in matches:
                    sighting_doc = {
                        "image_path": fpath,
                        "location": f"CCTV camera: {camera_id}",
                        "description": "Automated CCTV stream detection",
                        "uploaded_by": None,
                        "timestamp": datetime.now(timezone.utc),
                        "match_person_id": ObjectId(m["person_id"]),
                        "confidence_score": m["confidence"],
                    }
                    sr = await db.sightings.insert_one(sighting_doc)
                    await store_match(m["person_id"], str(sr.inserted_id), m["confidence"], db)
                    print(f"[CCTV] Match found: person={m['name']}  confidence={m['confidence']:.3f}")

        loop.run_until_complete(_persist_all(face_encodings, filename))

    cap.release()
    loop.close()
    print(f"[CCTV] Stream stopped: camera={camera_id}")


class StreamRequest(BaseModel):
    stream_url: str
    camera_id: str = "cam-01"
    frame_interval_seconds: int = 5  # Process one frame every N seconds


@router.post("/start-stream")
async def start_stream(
    payload: StreamRequest,
    background_tasks: BackgroundTasks,
    _admin=Depends(get_current_admin),
):
    if payload.camera_id in _active_streams:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Stream '{payload.camera_id}' is already running.",
        )

    stop_event = threading.Event()
    _active_streams[payload.camera_id] = stop_event

    t = threading.Thread(
        target=_stream_worker,
        args=(payload.stream_url, payload.camera_id, stop_event, payload.frame_interval_seconds),
        daemon=True,
    )
    t.start()

    return {
        "message": f"Stream '{payload.camera_id}' started.",
        "stream_url": payload.stream_url,
        "frame_interval_seconds": payload.frame_interval_seconds,
    }


@router.post("/stop-stream/{camera_id}")
async def stop_stream(camera_id: str, _admin=Depends(get_current_admin)):
    event = _active_streams.pop(camera_id, None)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active stream found for camera '{camera_id}'.",
        )
    event.set()
    return {"message": f"Stream '{camera_id}' stop signal sent."}


@router.get("/active-streams")
async def active_streams(_admin=Depends(get_current_admin)):
    return {"active_cameras": list(_active_streams.keys())}
