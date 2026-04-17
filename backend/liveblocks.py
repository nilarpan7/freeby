import httpx
from typing import List, Dict, Optional
from config import LIVEBLOCKS_SECRET_KEY

class LiveblocksService:
    def __init__(self):
        self.secret_key = LIVEBLOCKS_SECRET_KEY
        self.base_url = "https://api.liveblocks.io/v2"
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    async def create_room(self, room_id: str, metadata: Dict = None) -> Dict:
        """Create a new Liveblocks room for squad sprint"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/rooms",
                headers=self.headers,
                json={
                    "id": room_id,
                    "defaultAccesses": ["room:write"],
                    "metadata": metadata or {}
                }
            )
            return response.json()
    
    async def get_room(self, room_id: str) -> Optional[Dict]:
        """Get room details"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rooms/{room_id}",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
            return None
    
    async def delete_room(self, room_id: str) -> bool:
        """Delete a room after sprint completion"""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/rooms/{room_id}",
                headers=self.headers
            )
            return response.status_code == 204
    
    def generate_auth_token(self, user_id: str, room_id: str, user_info: Dict) -> str:
        """
        Generate a Liveblocks authentication token for a user
        This allows the user to join a specific room
        """
        import jwt
        import time
        
        payload = {
            "k": "acc",  # Access token type
            "pid": room_id,  # Room ID
            "uid": user_id,  # User ID
            "perms": {
                room_id: ["room:write", "room:presence:write"]
            },
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,  # 1 hour expiry
            "userInfo": user_info  # User metadata (name, avatar, etc.)
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm="HS256")
        return token
    
    async def add_participant(self, room_id: str, user_id: str) -> bool:
        """Add a participant to a room"""
        # Liveblocks handles this via auth tokens
        # This is a helper to track participants in our DB
        return True
    
    async def get_active_users(self, room_id: str) -> List[str]:
        """Get list of currently active users in a room"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rooms/{room_id}/active_users",
                headers=self.headers
            )
            if response.status_code == 200:
                data = response.json()
                return [user["id"] for user in data.get("data", [])]
            return []

# Singleton instance
liveblocks_service = LiveblocksService()
