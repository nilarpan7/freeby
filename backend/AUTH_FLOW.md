# Authentication Flow Documentation

## User Types

The system has two types of users:
- **Student**: Users who complete tasks and earn karma
- **Client**: Users who post tasks and hire students

## Authentication Methods

### 1. Google OAuth (Recommended)
### 2. Email/Password

---

## Google OAuth Flow

### Step 1: Google Sign-In

**Endpoint:** `POST /api/auth/google`

**Request Body:**
```json
{
  "token": "google_oauth_token_here",
  "role": "student"  // or "client"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "needs_profile_setup": true,  // or false if profile already completed
  "user": {
    "id": "student-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "profile_completed": false,
    "domain": null,
    "skills": [],
    "karma_score": 0,
    "avatar_url": "https://...",
    "github_url": "",
    "bio": "",
    "company": null,
    "tasks_completed": 0,
    "tasks_posted": 0,
    "created_at": "2024-01-01T00:00:00"
  }
}
```

### Step 2: Profile Setup (if needs_profile_setup = true)

**Endpoint:** `POST /api/auth/profile-setup`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (Student):**
```json
{
  "domain": "Frontend",  // Frontend, Backend, Data, DevOps
  "skills": ["React", "TypeScript", "Node.js"],
  "bio": "Passionate developer learning web technologies",
  "github_url": "https://github.com/username",
  "avatar_url": "https://..."  // Optional, can update Google avatar
}
```

**Request Body (Client):**
```json
{
  "domain": "Frontend",
  "skills": ["React", "TypeScript"],
  "bio": "Tech company looking for talented developers",
  "github_url": "",
  "avatar_url": "https://...",
  "company": "Tech Corp Inc."
}
```

**Response:**
```json
{
  "message": "Profile setup completed successfully",
  "user": {
    "id": "student-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "profile_completed": true,
    "domain": "Frontend",
    "skills": ["React", "TypeScript", "Node.js"],
    "karma_score": 0,
    "avatar_url": "https://...",
    "github_url": "https://github.com/username",
    "bio": "Passionate developer...",
    "company": null,
    "tasks_completed": 0,
    "tasks_posted": 0,
    "created_at": "2024-01-01T00:00:00"
  }
}
```

### Step 3: Access Dashboard

After profile setup is complete, redirect user to:
- **Students:** `/dashboard` (student dashboard)
- **Clients:** `/dashboard/client` (client dashboard)

---

## Email/Password Flow

### Step 1: Register

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "student"  // or "client"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "needs_profile_setup": true,
  "user": {
    "id": "student-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "profile_completed": false,
    ...
  }
}
```

### Step 2: Profile Setup

Same as Google OAuth Step 2 above.

### Login (Returning Users)

**Endpoint:** `POST /api/auth/login`

**Request Body (Form Data):**
```
username: user@example.com
password: securepassword123
```

**Response:**
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "needs_profile_setup": false,  // Profile already completed
  "user": {
    "id": "student-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "profile_completed": true,
    "domain": "Frontend",
    "skills": ["React", "TypeScript"],
    "karma_score": 150,
    ...
  }
}
```

---

## Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "student-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student",
  "profile_completed": true,
  "domain": "Frontend",
  "skills": ["React", "TypeScript", "Node.js"],
  "karma_score": 150,
  "avatar_url": "https://...",
  "github_url": "https://github.com/username",
  "bio": "Passionate developer...",
  "company": null,
  "tasks_completed": 15,
  "tasks_posted": 0,
  "created_at": "2024-01-01T00:00:00"
}
```

---

## Frontend Implementation Guide

### 1. Google OAuth Button

```typescript
// Install: npm install @react-oauth/google

import { GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={async (credentialResponse) => {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: credentialResponse.credential,
        role: 'student' // or 'client'
      })
    });
    
    const data = await response.json();
    
    // Store token
    localStorage.setItem('access_token', data.access_token);
    
    // Check if profile setup needed
    if (data.needs_profile_setup) {
      router.push('/profile-setup');
    } else {
      router.push('/dashboard');
    }
  }}
  onError={() => {
    console.log('Login Failed');
  }}
/>
```

### 2. Profile Setup Form

```typescript
const setupProfile = async (profileData) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('/api/auth/profile-setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  
  const data = await response.json();
  
  // Redirect to dashboard
  router.push('/dashboard');
};
```

### 3. Protected Routes

```typescript
// middleware.ts or auth check
const checkAuth = async () => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    router.push('/auth');
    return;
  }
  
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    localStorage.removeItem('access_token');
    router.push('/auth');
    return;
  }
  
  const user = await response.json();
  
  // Check if profile setup needed
  if (!user.profile_completed) {
    router.push('/profile-setup');
    return;
  }
  
  return user;
};
```

---

## Environment Variables

Make sure these are set in your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days
```

---

## Key Points

1. **Karma-Based Identity**: No resume or experience fields. Identity is built through karma score earned by completing tasks.

2. **Profile Setup Required**: New users must complete profile setup before accessing the dashboard.

3. **Two User Types**: Students complete tasks, Clients post tasks.

4. **Google OAuth Recommended**: Simpler flow for users, no password management.

5. **JWT Tokens**: Access tokens expire after 7 days by default.

6. **Profile Completion Check**: Always check `profile_completed` flag before allowing dashboard access.
