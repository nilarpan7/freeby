#!/usr/bin/env python3
"""
Quick test script to verify Google OAuth configuration
Run this to check if your backend is properly set up for Google OAuth
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_google_oauth_config():
    """Test Google OAuth configuration"""
    print("🔍 Testing Google OAuth Configuration...\n")
    
    # Check environment variables
    google_client_id = os.getenv('GOOGLE_CLIENT_ID')
    google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    secret_key = os.getenv('SECRET_KEY')
    
    issues = []
    
    # Test 1: Google Client ID
    if not google_client_id:
        issues.append("❌ GOOGLE_CLIENT_ID is not set in .env")
    elif google_client_id == 'your-google-client-id.apps.googleusercontent.com':
        issues.append("⚠️  GOOGLE_CLIENT_ID is still the placeholder value")
    else:
        print(f"✅ GOOGLE_CLIENT_ID is set: {google_client_id[:20]}...")
    
    # Test 2: Google Client Secret
    if not google_client_secret:
        issues.append("❌ GOOGLE_CLIENT_SECRET is not set in .env")
    elif google_client_secret == 'your-google-client-secret':
        issues.append("⚠️  GOOGLE_CLIENT_SECRET is still the placeholder value")
    else:
        print(f"✅ GOOGLE_CLIENT_SECRET is set: {google_client_secret[:10]}...")
    
    # Test 3: JWT Secret Key
    if not secret_key:
        issues.append("❌ SECRET_KEY is not set in .env")
    elif len(secret_key) < 32:
        issues.append("⚠️  SECRET_KEY should be at least 32 characters long")
    else:
        print(f"✅ SECRET_KEY is set (length: {len(secret_key)})")
    
    # Test 4: Check if google-auth is installed
    try:
        import google.auth
        from google.oauth2 import id_token
        print("✅ google-auth package is installed")
    except ImportError:
        issues.append("❌ google-auth package is not installed. Run: pip install google-auth")
    
    # Test 5: Check if auth.py exists and has verify_google_token
    try:
        from auth import verify_google_token
        print("✅ verify_google_token function is available in auth.py")
    except ImportError as e:
        issues.append(f"❌ Cannot import verify_google_token: {e}")
    
    # Test 6: Check if database models are set up
    try:
        from database.models import User, UserRole
        print("✅ Database models are available")
    except ImportError as e:
        issues.append(f"❌ Cannot import database models: {e}")
    
    # Test 7: Check if auth routes exist
    try:
        from routes.auth_routes import router
        print("✅ Auth routes are available")
    except ImportError as e:
        issues.append(f"❌ Cannot import auth routes: {e}")
    
    print("\n" + "="*60)
    
    if issues:
        print("\n⚠️  Issues Found:\n")
        for issue in issues:
            print(f"  {issue}")
        print("\n💡 Fix these issues before testing Google OAuth")
        return False
    else:
        print("\n✅ All checks passed! Google OAuth is properly configured.")
        print("\n📝 Next steps:")
        print("  1. Start the backend: python run.py")
        print("  2. Start the frontend: cd ../frontend && npm run dev")
        print("  3. Navigate to http://localhost:3000/auth")
        print("  4. Click 'Continue with Google'")
        return True

if __name__ == "__main__":
    test_google_oauth_config()
