---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*.{ts,tsx,js,jsx}"
---

# Frontend Development Guide

## Environment Setup
```bash
cd frontend
npm install
```

## Running the Frontend
```bash
cd frontend
npm run dev
# Development server runs on http://localhost:3000
```

## Project Structure
- **App Router**: `frontend/src/app/` - Next.js 14 App Router
- **Components**: `frontend/src/components/` - Reusable UI components
- **Lib**: `frontend/src/lib/` - Utilities, API clients, types
- **Public**: `frontend/public/` - Static assets

## Key Files
- `frontend/src/lib/api.ts` - API client for backend communication
- `frontend/src/lib/auth-context.tsx` - Authentication context
- `frontend/src/lib/google-auth.ts` - Google OAuth integration
- `frontend/src/lib/types.ts` - TypeScript type definitions
- `frontend/src/lib/mock-data.ts` - Mock data for development

## Styling
- Tailwind CSS configured in `tailwind.config.ts`
- Global styles in `frontend/src/app/globals.css`
- Use utility classes for rapid styling
- Custom components in `frontend/src/components/`

## API Integration
```typescript
import { api } from '@/lib/api';

// Example API call
const response = await api.get('/endpoint');
const data = await response.json();
```

## Authentication
- Google OAuth via `frontend/src/lib/google-auth.ts`
- Auth context provides user state globally
- Protected routes check authentication status

## Development Tips
1. Use TypeScript strict mode for type safety
2. Implement error boundaries for React components
3. Use React hooks for state management
4. Optimize images with Next.js Image component
5. Implement loading states for async operations