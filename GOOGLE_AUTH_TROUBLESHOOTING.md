# 🔧 Google OAuth Troubleshooting Guide

## Current Status
- ✅ **Backend**: Running on http://localhost:8000
- ✅ **Frontend**: Running on http://localhost:3001 (port changed)
- ✅ **API Endpoint**: `/api/auth/google` accessible
- ✅ **Environment**: Google Client ID configured

## Issue: "Failed to Fetch" Error

### Root Causes & Solutions

#### 1. Port Mismatch Issue ⚠️
**Problem**: Frontend moved to port 3001, but API calls still go to port 8000
**Solution**: This is actually correct - frontend (3001) calls backend (8000)

#### 2. CORS Configuration
**Check**: Backend CORS allows frontend origin
```python
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 3. Network Connectivity
**Test Backend Health**:
```bash
# Test if backend is accessible
curl http://localhost:8000/
# Should return: {"message": "Kramic.sh API", "version": "1.0.0"}
```

#### 4. Google OAuth Token Format
**Issue**: Google returns JWT token, backend expects valid JWT
**Check**: Token should be a proper JWT with 3 parts separated by dots

## Enhanced Error Handling

### Added Logging
The API client now logs all requests:
```typescript
console.log(`API Call: POST http://localhost:8000/api/auth/google`);
console.log(`API Response: 200 OK`);
```

### Better Error Messages
```typescript
// Network errors now show helpful message
throw new ApiError(0, 'Network error - please check if the backend is running');
```

## Testing Steps

### 1. Test Backend Directly
```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/" -Method GET
# Should return API info
```

### 2. Test Google OAuth Endpoint
```bash
# This should fail with "Invalid Google token" (expected)
Invoke-RestMethod -Uri "http://localhost:8000/api/auth/google" -Method POST -ContentType "application/json" -Body '{"token":"test","role":"student"}'
```

### 3. Test Frontend Connection
1. Open browser console (F12)
2. Go to http://localhost:3001/auth
3. Click "Continue with Google"
4. Check console for API call logs

## Expected Flow

### Successful Google OAuth
```
1. User clicks "Continue with Google"
2. Google popup appears
3. User selects account
4. Google returns JWT credential
5. Frontend calls: POST /api/auth/google
6. Console shows: "API Call: POST http://localhost:8000/api/auth/google"
7. Console shows: "API Response: 200 OK"
8. User redirected to /auth/setup
```

### Error Scenarios

#### Network Error
```
Console: "Network Error: Failed to fetch"
Cause: Backend not running or wrong URL
Fix: Start backend with `python run.py`
```

#### CORS Error
```
Console: "Access to fetch at 'http://localhost:8000/api/auth/google' from origin 'http://localhost:3001' has been blocked by CORS policy"
Cause: Backend CORS not allowing frontend origin
Fix: Add port 3001 to CORS origins
```

#### Invalid Token Error
```
Console: "API Response: 401 Unauthorized"
Error: "Invalid Google token"
Cause: Google token verification failed
Fix: Check Google Client ID/Secret match
```

## Quick Fixes

### Fix 1: Update CORS for Port 3001
```python
# In backend/main.py, update CORS to include port 3001
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Fix 2: Check Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000  # ✅ Correct
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID  # ✅ Set

# Backend (.env)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID  # ✅ Set
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET  # ✅ Set
```

### Fix 3: Restart Both Servers
```bash
# Backend
cd backend
python run.py

# Frontend  
cd frontend
npm run dev
```

## Test Now

### 1. Open Browser Console
- Press F12
- Go to Console tab

### 2. Navigate to Auth Page
```
http://localhost:3001/auth
```

### 3. Try Google Login
- Click "Continue with Google"
- Watch console for API calls
- Check for any error messages

### 4. Expected Console Output
```
API Call: POST http://localhost:8000/api/auth/google
Google Auth API call: {role: "student", tokenLength: 1234}
API Response: 200 OK
```

## Alternative: Use Quick Demo Login

If Google OAuth is still not working:
1. Click "⚡ Quick Demo Login" on auth page
2. Select "Alex Chen" (Backend student)
3. ✅ Instant access to test the rest of the platform

## Debug Commands

### Check Backend Status
```bash
# Test root endpoint
curl http://localhost:8000/

# Test auth endpoint (should fail with invalid token)
curl -X POST http://localhost:8000/api/auth/google -H "Content-Type: application/json" -d '{"token":"test","role":"student"}'
```

### Check Frontend Network
1. Open DevTools (F12)
2. Go to Network tab
3. Try Google login
4. Look for failed requests to localhost:8000

## Summary

The "failed to fetch" error is most likely due to:
1. ✅ **Backend not running** - Fixed (restarted)
2. ✅ **Frontend port change** - Now on 3001
3. ⚠️ **CORS configuration** - May need port 3001 added
4. ⚠️ **Network connectivity** - Test with curl

**Next step**: Test at http://localhost:3001/auth and check browser console for detailed error messages.