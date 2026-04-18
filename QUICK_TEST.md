# ⚡ Quick Test Guide

## 🎯 Test Google OAuth in 3 Steps

### 1. Open Auth Page
```
http://localhost:3000/auth
```

### 2. Click Google Button
Scroll down and click **"Continue with Google"**

### 3. Select Account
Choose your Google account in the popup

✅ **Success**: You'll be redirected to the dashboard!

---

## 🔍 What to Check

### ✅ Backend Running
- URL: http://localhost:8000
- Status: Should see "Application startup complete"

### ✅ Frontend Running
- URL: http://localhost:3000
- Status: Should see "Ready in XXXms"

### ✅ Google OAuth Working
- Button appears on auth page
- Clicking shows Google popup
- After login, redirects to dashboard

---

## 🐛 Quick Fixes

### Google Popup Doesn't Show
```bash
# Check browser console for errors
# Disable popup blockers
# Clear cache: Ctrl+Shift+Delete
```

### Backend Not Running
```bash
cd backend
python run.py
```

### Frontend Not Running
```bash
cd frontend
npm run dev
```

---

## 🎮 Alternative: Demo Login

Don't want to use Google? Try **Quick Demo Login**:

1. Click "⚡ Quick Demo Login" on auth page
2. Select a pre-made account:
   - **Alex Chen** (Backend student)
   - **Sarah Kim** (Frontend student)
   - **Mike Johnson** (Data student)
   - **TechCorp** (Client)
3. Instant access!

---

## 📊 Test Results

### Expected Behavior
- ✅ Google button visible
- ✅ Popup appears on click
- ✅ Account selection works
- ✅ Redirects to dashboard
- ✅ User data saved in database

### Common Issues
- ❌ "Google Sign-In not configured" → Check `.env.local`
- ❌ "Invalid Google token" → Check Client ID matches
- ❌ Connection refused → Start backend server
- ❌ Popup blocked → Disable popup blocker

---

## 🔗 Quick Links

- **Auth Page**: http://localhost:3000/auth
- **Dashboard**: http://localhost:3000/dashboard
- **API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/api/auth/me

---

## 📝 Test Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 3000
- [ ] Navigate to auth page
- [ ] See "Continue with Google" button
- [ ] Click button
- [ ] Google popup appears
- [ ] Select Google account
- [ ] Redirect to dashboard
- [ ] User data in database

---

## 🎉 Success Indicators

When everything works:
1. ✅ No console errors
2. ✅ Google popup shows accounts
3. ✅ Dashboard loads after login
4. ✅ User name appears in header
5. ✅ Can navigate to other pages

---

## 💡 Pro Tips

- **Test with different accounts** to verify multi-user support
- **Check Network tab** in DevTools to see API calls
- **Monitor backend logs** for debugging
- **Use Demo Login** for quick testing without Google
- **Clear localStorage** to test fresh login: `localStorage.clear()`

---

## 🚀 Ready to Test!

Both servers are running. Google OAuth is configured. Just open:

**http://localhost:3000/auth**

And click **"Continue with Google"**!
