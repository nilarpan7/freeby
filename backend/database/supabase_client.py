"""Supabase client for server-side operations (Telegram bot, etc.)."""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY", "")

_client: Client | None = None


def get_supabase() -> Client:
    """Return a singleton Supabase client.

    Prefers SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) but falls back to the
    anon/publishable key when running in development without a service key.
    """
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "Missing SUPABASE_URL or SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY in .env"
            )
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"[OK] Supabase client initialized ({SUPABASE_URL})")
    return _client
