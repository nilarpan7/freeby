import os
from dotenv import load_dotenv

load_dotenv()

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/callback")

# MongoDB Database
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "kramic_db")

# Liveblocks
LIVEBLOCKS_SECRET_KEY = os.getenv("LIVEBLOCKS_SECRET_KEY", "")

# Redis (for session management)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
