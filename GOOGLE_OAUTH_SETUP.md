# Google OAuth Setup & Testing Guide

## ✅ What's Been Fixed

I've created the missing `frontend/src/lib/google-auth.ts` file that implements Google Identity Services integration. The Google OAuth flow is now complete!

## 🔧 Current Setup

### Backend (✅ Complete)
- **File**: `backend/auth.py` - Contains `verify_google_token()` function
- **Route**: `POST /api/auth/google` - Handles Google OAuth tokens
- **Dependencies**: `google-auth` package installed in `requirements.txt`
- **Config**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`

### Frontend (✅ Complete)
- **File**: `frontend/src/lib/google-auth.ts` - Google Identity Services integration (JUST CREATED)
- **File**: `frontend/src/lib/auth-context.tsx` - Has `googleLogin()` function
- **File**: `frontend/src/app/auth/page.tsx` - Auth page with Google button
- **Config**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `frontend/.env.local`

## 🚀 How to Test Google OAuth

### Step 1: Start the Backend
```bash
cd backend
python run.py
```
The backend should start on `http://localhost:8000`

### Step 2: Start the Frontend
```bash
cd frontend
npm run dev
```
The frontend should start on `http://localhost:3000`

### Step 3: Test Google Login
1. Navigate to `http://localhost:3000/auth`
2. Click the "Continue with Google" button at the bottom
3. A Google Sign-In popup should appear
4. Select your Google account
5. You'll be redirected to the dashboard

## 🔑 Google OAuth Credentials

Your current credentials in `.env` files:
- **Client ID**: `YOUR_GOOGLE_CLIENT_ID`
- **Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET`

### Verify Authorized Redirect URIs
Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and ensure these URIs are authorized:
- `http://localhost:3000`
- `http://localhost:3000/auth`
- `http://localhost:3000/auth/callback`

## 🔄 How Google OAuth Works

### Flow Diagram
```
1. User clicks "Continue with Google"
   ↓
2. Google Sign-In popup appears (Google Identity Services)
   ↓
3. User selects Google account
   ↓
4. Google returns JWT credential token
   ↓
5. Frontend sends token to backend: POST /api/auth/google
   ↓
6. Backend verifies token with Google
   ↓
7. Backend creates/updates user in database
   ↓
8. Backend returns JWT access token
   ↓
9. Frontend stores token and redirects to dashboard
```

### Code Flow

**Frontend** (`frontend/src/app/auth/page.tsx`):
```typescript
// Initialize Google OAuth on component mount
React.useEffect(() => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  const cleanup = initializeGoogleAuth(clientId, async (response) => {
    await googleLogin(response.credential, { role });
    router.push('/dashboard');
  });
  
  return cleanup;
}, [role, googleLogin, router]);

// Trigger Google Sign-In
const handleGoogleLogin = () => {
  if (window.google) {
    window.google.accounts.id.prompt();
  }
};
```

**Frontend** (`frontend/src/lib/auth-context.tsx`):
```typescript
const googleLogin = async (token: string, data: GoogleLoginData) => {
  const response = await authApi.googleAuth({ token, ...data });
  localStorage.setItem('kramic_token', response.access_token);
  setUser(response.user);
};
```

**Backend** (`backend/routes/auth_routes.py`):
```python
@router.post("/google", response_model=TokenResponse)
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    # Verify Google token
    google_user = await verify_google_token(request.token)
    
    # Check if user exists or create new user
    user = db.query(User).filter(User.google_id == google_user["google_id"]).first()
    
    if not user:
        user = User(
            id=f"{request.role.value}-{uuid.uuid4()}",
            email=google_user["email"],
            name=google_user["name"],
            role=request.role,
            google_id=google_user["google_id"],
            avatar_url=google_user["avatar_url"],
            profile_completed=False,
            karma_score=0
        )
        db.add(user)
        db.commit()
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "user": {...}}
```

## 🐛 Troubleshooting

### Issue: "Google Sign-In not configured"
**Solution**: Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `frontend/.env.local` and is not the placeholder value.

### Issue: "Invalid Google token"
**Solution**: 
1. Check that `GOOGLE_CLIENT_ID` in `backend/.env` matches `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `frontend/.env.local`
2. Verify the Client ID is correct in Google Cloud Console
3. Ensure authorized redirect URIs are configured

### Issue: Google popup doesn't appear
**Solution**:
1. Check browser console for errors
2. Ensure Google Identity Services script is loaded (check Network tab)
3. Try clearing browser cache and cookies
4. Check if popup blockers are enabled

### Issue: "Failed to connect to MetaMask"
**Note**: This error is unrelated to Google OAuth. It's from the blockchain integration trying to connect to MetaMask. You can ignore it if you're not using blockchain features.

### Issue: Backend connection refused (ERR_CONNECTION_REFUSED)
**Solution**: Make sure the backend is running on port 8000:
```bash
cd backend
python run.py
```

## 📝 Environment Variables Checklist

### Frontend (`frontend/.env.local`)
- [x] `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [x] `NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID`
- [ ] `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` (optional for now)

### Backend (`backend/.env`)
- [x] `GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID`
- [x] `GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET`
- [x] `SECRET_KEY` (for JWT)
- [x] `DATABASE_URL=sqlite:///./kramic.db`

## 🎯 Quick Test Commands

### Test Backend Health
```bash
curl http://localhost:8000/api/auth/me
# Should return 401 Unauthorized (expected without token)
```

### Test Backend Google Endpoint
```bash
curl -X POST http://localhost:8000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token":"test","role":"student"}'
# Should return 401 Invalid Google token (expected with fake token)
```

### Check Frontend Build
```bash
cd frontend
npm run build
# Should build successfully without errors
```

## ✨ Alternative: Quick Demo Login

If Google OAuth is not working, users can still use the **Quick Demo Login** feature:
- Click "⚡ Quick Demo Login" on the auth page
- Select a pre-made demo account
- Instantly access the dashboard

This is useful for:
- Testing the app without Google OAuth setup
- Demos and presentations
- Development without internet connection

## 🎉 Summary

**Google OAuth is now fully implemented!** The missing `google-auth.ts` file has been created with:
- Google Identity Services integration
- Proper script loading and initialization
- Error handling and fallbacks
- TypeScript type definitions
- Cleanup functions for React components

**To test**: Start both backend and frontend servers, then click "Continue with Google" on the auth page.
