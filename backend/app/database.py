from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URL, DB_NAME

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    # Ensure indexes for performance
    await db.users.create_index("email", unique=True)
    await db.missing_persons.create_index("status")
    await db.matches.create_index([("person_id", 1), ("sighting_id", 1)])
    print(f"Connected to MongoDB Atlas — database: {DB_NAME}")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")


def get_db():
    return db
