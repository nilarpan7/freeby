# Kramic.sh — Frontend

> **The Resume is Dead. Your Work Graph is Your Identity.**

A work-verification and referral protocol designed to eliminate the Tier-2/3 opportunity gap in tech hiring.

## 🎯 Overview

Kramic.sh is a Next.js 14 application that enables students to build portable, verifiable Karma Graphs by completing real micro-tasks and collaborating on open-source sprints. The platform uses on-chain attestations, peer endorsements, and direct senior-employee vouching to bypass ATS filters and match talent directly with full-time roles.

## ✨ Features

### For Students
- **College-Blind Profiles** — No field for college name, only skills and work
- **Task Discovery** — AI-powered matching connects students to seniors based on skill overlap
- **Solo Micro-Tasks** — Complete small, scoped tasks (max 4 hours) set by industry seniors
- **Squad Sprints** — Collaborate in teams of 2-4 on mini-projects with real-time cursors
- **Karma System** — Earn reputation points for completed work, peer endorsements, and production deploys
- **Referral Unlock** — Request referrals from seniors after reaching 500 Karma

### For Senior Engineers
- **Post Micro-Tasks** — Share real-world tasks you'd otherwise do yourself
- **Review Dashboard** — Pass/Flag interface with optional feedback
- **Mentor Score** — Public score based on students mentored and successful hires
- **Referral Bonuses** — Earn company referral bonuses when referred students are hired

### Core Pages
- **Landing Page** (`/`) — Marketing site with hand-drawn aesthetic
- **Auth** (`/auth`) — Role-based authentication (Student/Senior)
- **Student Dashboard** (`/dashboard`) — Task feed, karma overview, active tasks
- **Senior Dashboard** (`/dashboard/senior`) — Review queue, post tasks, mentor stats
- **Task Detail** (`/task/[id]`) — Full task description, claim, and submission flow
- **Profile** (`/profile/[id]`) — User profile with karma activity and completed tasks
- **Leaderboard** (`/leaderboard`) — Top builders ranked by karma score
- **Arena** (`/arena/[id]`) — Live coding environment with WebSocket terminal (experimental)

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS 4 + Custom hand-drawn aesthetic
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Terminal:** xterm.js + FitAddon
- **State Management:** React Context (Auth)
- **Data:** Mock data store (ready for backend integration)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── auth/              # Authentication
│   │   ├── dashboard/         # Student & Senior dashboards
│   │   ├── task/[id]/         # Task detail page
│   │   ├── profile/[id]/      # User profile
│   │   ├── leaderboard/       # Karma leaderboard
│   │   ├── arena/[id]/        # Live coding arena
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   └── HandDrawn.tsx      # Reusable UI components
│   └── lib/
│       ├── auth-context.tsx   # Auth state management
│       ├── types.ts           # TypeScript interfaces
│       └── mock-data.ts       # Demo data store
├── public/                     # Static assets
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 🎨 Design System

### Hand-Drawn Aesthetic
The UI uses a unique "sketched with a 2B pencil" aesthetic:
- **SVG Filters:** `rough-paper` and `pencil-texture` for organic feel
- **Sketch Borders:** Irregular border-radius helpers (`.sketch-border-1`, `.sketch-border-2`, `.sketch-border-3`)
- **Shadow System:** Offset shadows (`shadow-[8px_8px_0px_rgba(0,0,0,1)]`)
- **Highlight Component:** Animated background highlights for emphasis

### Color Palette
```css
--bg-cream: #fdfbf7
--accent-yellow: #ffeb3b (Karma)
--accent-cyan: #a5f3fc (Tasks)
--accent-green: #bbf7d0 (Success)
--accent-orange: #fed7aa (Seniors)
--accent-red: #fca5a5 (Errors)
--accent-purple: #ddd6fe (Endorsements)
```

### Components
- `HandDrawnFilters` — SVG filter definitions
- `Highlight` — Animated text highlight
- `SketchButton` — Hand-drawn button with SVG border
- `SketchInput` / `SketchTextarea` — Form inputs with sketch aesthetic
- `KarmaBadge` — Karma score display with gradient
- `DifficultyBadge` — Task difficulty indicator
- `StatusPill` — Task status with animated dot
- `ProgressRing` — Circular progress indicator
- `TagInput` — Multi-tag input with chip UI

## 🔗 Backend Integration

The frontend is currently using mock data (`src/lib/mock-data.ts`). To connect to a real backend:

1. Replace mock data imports with API calls
2. Update `src/lib/auth-context.tsx` to use JWT tokens
3. Connect WebSocket in `arena/[id]/page.tsx` to your backend
4. Implement EAS attestation minting on task approval

### Expected API Endpoints
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks/:id/claim
POST   /api/tasks/:id/submit
POST   /api/tasks (senior only)
GET    /api/users/:id
GET    /api/leaderboard
GET    /api/karma/:userId
WS     /ws/arena/:id
```

## 🧪 Demo Accounts

Quick login accounts are available on the `/auth` page:

**Students:**
- Rahul Kumar (480 Karma, Backend)
- Ananya Singh (350 Karma, Frontend)
- Vikram Patel (520 Karma, Data)

**Seniors:**
- Priya Sharma (Google, Backend)
- Arjun Mehta (Razorpay, Frontend)
- Sneha Gupta (Microsoft, Data)

## 📊 Karma System

| Event | Karma | Notes |
|-------|-------|-------|
| Task Approved | +10 | Standard approval by Senior |
| Task Flagged | -5 | Penalty for non-functional work |
| Sprint Complete | +20 | Awarded to all squad members |
| Peer Upvote | +2 to +5 | Limited to 3 per sprint |
| Production Deploy | +50 | Merge to main of partner repo |
| Code Review | +3 | Meaningful PR review |

**Decay:** Karma older than 6 months is weighted at 50%, older than 12 months is historical only.

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

This is a hackathon MVP. Contributions welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License — See LICENSE file for details

## 🔗 Links

- **PRD:** See `KRAMIC_PRD.md` for full product requirements
- **Backend:** See `../backend/` for FastAPI backend
- **Live Demo:** [Coming Soon]

---

**Built with conviction. Designed with a 2B Pencil. 🎯**
