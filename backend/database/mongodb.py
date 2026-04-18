from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from config import MONGODB_URL, DATABASE_NAME
from database.mongodb_models import (
    User,
    Task,
    TaskSubmission,
    KarmaEvent,
    TaskApplication,
    SprintSession,
    ReferralRequest
)

# MongoDB client
mongodb_client: AsyncIOMotorClient = None

async def connect_to_mongodb():
    """Connect to MongoDB and initialize Beanie ODM"""
    global mongodb_client
    
    import traceback
    try:
        # Create MongoDB client
        mongodb_client = AsyncIOMotorClient(MONGODB_URL)

        # Get database
        database = mongodb_client[DATABASE_NAME]

        # Initialize Beanie with document models
        await init_beanie(
            database=database,
            document_models=[
                User,
                Task,
                TaskSubmission,
                KarmaEvent,
                TaskApplication,
                SprintSession,
                ReferralRequest
            ]
        )

        print(f"[OK] Connected to MongoDB: {DATABASE_NAME}")

    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")
        traceback.print_exc()
        raise

async def close_mongodb_connection():
    """Close MongoDB connection"""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("[OK] MongoDB connection closed")

def get_database():
    """Get MongoDB database instance"""
    if mongodb_client:
        return mongodb_client[DATABASE_NAME]
    return None
