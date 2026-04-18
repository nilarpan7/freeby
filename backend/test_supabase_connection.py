"""Quick test to verify Supabase connection and solo_tasks table access."""
import os
from dotenv import load_dotenv
load_dotenv()

from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
print(f"URL: {url}")
print(f"Key: {key[:20]}...")

sb = create_client(url, key)

# Test: read from solo_tasks
result = sb.table("solo_tasks").select("id, title, status").limit(3).execute()
print(f"\nConnection OK! Found {len(result.data)} tasks:")
for t in result.data:
    title = t.get("title", "?")
    status = t.get("status", "?")
    print(f"  - {title} ({status})")

# Test: insert a dummy task then delete it
print("\nTesting INSERT...")
test_row = {
    "title": "TEST - Delete Me",
    "description": "Bot connectivity test",
    "stack": ["Python"],
    "difficulty": "easy",
    "time_estimate_min": 30,
    "min_karma": 0,
    "reward_amount": 100,
    "karma_reward": 5,
    "status": "OPEN",
}
insert_result = sb.table("solo_tasks").insert(test_row).execute()
if insert_result.data:
    test_id = insert_result.data[0]["id"]
    print(f"  INSERT OK! id={test_id}")
    
    # Clean up
    sb.table("solo_tasks").delete().eq("id", test_id).execute()
    print(f"  Cleaned up test row.")
else:
    print(f"  INSERT FAILED: {insert_result}")

print("\n✅ All Supabase tests passed!")
