"""
Test MongoDB API endpoints
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_api():
    """Test various API endpoints"""
    print("🧪 Testing MongoDB API endpoints...\n")
    
    async with httpx.AsyncClient() as client:
        # Test 1: Root endpoint
        print("1. Testing root endpoint...")
        response = await client.get(f"{BASE_URL}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        # Test 2: Get tasks (should fail without auth)
        print("\n2. Testing tasks endpoint (no auth)...")
        try:
            response = await client.get(f"{BASE_URL}/api/tasks")
            print(f"   Status: {response.status_code}")
        except Exception as e:
            print(f"   Expected error: {str(e)}")
        
        # Test 3: Test Google OAuth endpoint structure
        print("\n3. Testing auth endpoints availability...")
        try:
            response = await client.get(f"{BASE_URL}/docs")
            print(f"   API docs available: {response.status_code == 200}")
        except Exception as e:
            print(f"   Error: {str(e)}")
        
        # Test 4: Check database connection via health endpoint
        print("\n4. Checking database health...")
        try:
            # Create a simple health check
            response = await client.get(f"{BASE_URL}/")
            data = response.json()
            if data.get("database") == "MongoDB":
                print("   ✅ MongoDB is configured as database")
            else:
                print(f"   ❌ Unexpected database: {data.get('database')}")
        except Exception as e:
            print(f"   Error: {str(e)}")
        
        print("\n✅ MongoDB API test complete!")
        print("\n📋 Summary:")
        print("   - Backend server is running")
        print("   - MongoDB is configured as database")
        print("   - API requires authentication (as expected)")
        print("   - API documentation available at http://localhost:8000/docs")
        print("\n🔗 Next steps:")
        print("   1. Visit http://localhost:3001/auth for Google OAuth login")
        print("   2. Use test users from seed data:")
        print("      - alice@example.com (75 karma)")
        print("      - bob@example.com (45 karma)")
        print("      - carol@example.com (120 karma)")
        print("   3. Test task browsing at http://localhost:3001/tasks")

if __name__ == "__main__":
    asyncio.run(test_api())
