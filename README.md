# ARYA HackVerse

Frontend and backend are wired together through the Vite dev proxy.

## Run locally

1. Start MongoDB and make sure the backend environment variables are set.
2. Install backend dependencies from `backend/requirements.txt`.
3. Run the FastAPI app on `http://localhost:8000`.
4. Run the frontend with `npm install` and `npm run dev` from the repository root.

The frontend now proxies both `/api` and `/uploads` to the backend, stores the JWT returned by login, and submits missing-person and sighting reports as multipart form uploads.
