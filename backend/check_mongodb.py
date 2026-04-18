"""
Quick MongoDB connection checker for Kramic.sh
Run this to verify your MongoDB setup before starting the server
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URL, DATABASE_NAME

async def check_mongodb():
    """Check if MongoDB is accessible"""
    print("🔍 Checking MongoDB connection...")
    print(f"   URL: {MONGODB_URL}")
    print(f"   Database: {DATABASE_NAME}\n")
    
    try:
        # Try to connect
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        
        # Ping the server
        await client.admin.command('ping')
        
        print("✅ MongoDB connection successful!")
        
        # Check if database exists
        db = client[DATABASE_NAME]
        collections = await db.list_collection_names()
        
        if collections:
            print(f"\n📊 Found {len(collections)} collections:")
            for collection in collections:
                count = await db[collection].count_documents({})
                print(f"   - {collection}: {count} documents")
        else:
            print("\n⚠️  Database is empty. Run 'python seed_mongodb.py' to populate it.")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed!")
        print(f"   Error: {str(e)}\n")
        
        print("📝 Setup Instructions:")
        print("\n   Option 1: Local MongoDB")
        print("   1. Install MongoDB from https://www.mongodb.com/try/download/community")
        print("   2. Start MongoDB service:")
        print("      Windows: net start MongoDB")
        print("      macOS: brew services start mongodb-community")
        print("      Linux: sudo systemctl start mongod")
        print("   3. Update .env: MONGODB_URL=mongodb://localhost:27017")
        
        print("\n   Option 2: MongoDB Atlas (Cloud - Free)")
        print("   1. Create account at https://www.mongodb.com/cloud/atlas/register")
        print("   2. Create a free M0 cluster")
        print("   3. Get connection string and update .env")
        print("   4. Example: MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/")
        
        print("\n   See backend/MONGODB_SETUP.md for detailed instructions.")
        
        return False

if __name__ == "__main__":
    result = asyncio.run(check_mongodb())
    sys.exit(0 if result else 1)
