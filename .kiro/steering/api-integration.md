---
inclusion: fileMatch
fileMatchPattern: "**/api.{ts,tsx,js,jsx,py}"
---

# API Integration Patterns

## Backend API Structure
- Base URL: `http://localhost:8000` (development)
- RESTful endpoints with proper HTTP methods
- JSON request/response format
- Error responses include status codes and messages

## Frontend API Client
Located in `frontend/src/lib/api.ts`:
```typescript
import { api } from '@/lib/api';

// GET request
const data = await api.get('/endpoint');

// POST request  
const result = await api.post('/endpoint', { data });

// PUT request
const updated = await api.put('/endpoint/id', { data });

// DELETE request
await api.delete('/endpoint/id');
```

## Authentication Flow
1. Frontend initiates Google OAuth via `/auth/google`
2. Backend validates token and creates session
3. Session token stored in HTTP-only cookie
4. Subsequent requests include session token automatically

## Error Handling
```typescript
try {
  const response = await api.get('/endpoint');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('API call failed:', error);
  // Show user-friendly error message
}
```

## Real-time Updates (Liveblocks)
- Integration via `backend/liveblocks.py`
- Frontend connects to Liveblocks room
- Real-time collaboration features
- Presence tracking

## Blockchain Integration
- Smart contract interactions via `backend/blockchain.py`
- Web3.js/ethers.js for frontend blockchain operations
- Transaction signing and confirmation
- Event listening

## Rate Limiting
- Backend implements rate limiting per IP/user
- Frontend handles 429 (Too Many Requests) responses
- Exponential backoff for retries

## Caching Strategy
- Frontend: React Query for API data caching
- Backend: Redis for frequent queries (optional)
- Cache invalidation on data updates

## WebSocket/SSE
- Real-time notifications via WebSocket
- Server-Sent Events for one-way updates
- Connection management and reconnection

## File Uploads
- Multipart form data for file uploads
- Cloud storage integration (S3, Cloudinary)
- Progress tracking for large files

## Testing API Endpoints
```bash
# Using curl
curl -X GET http://localhost:8000/api/endpoint
curl -X POST -H "Content-Type: application/json" -d '{"key":"value"}' http://localhost:8000/api/endpoint

# Using Python requests
import requests
response = requests.get('http://localhost:8000/api/endpoint')
print(response.json())
```