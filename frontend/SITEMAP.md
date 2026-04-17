# Kramic.sh — Site Map

## 🗺️ Page Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      Landing Page (/)                        │
│  • Hero with hand-drawn aesthetic                           │
│  • How It Works (3 steps)                                   │
│  • For Students vs For Seniors                              │
│  • Karma System showcase                                    │
│  • Stats bar                                                │
│  • CTA buttons → /auth                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Authentication (/auth)                    │
│  • Role selector (Student/Senior)                           │
│  • Quick demo login                                         │
│  • Signup form (college-blind)                              │
│  • Domain & skill selection                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │  Student Dashboard    │   │  Senior Dashboard     │
    │    (/dashboard)       │   │ (/dashboard/senior)   │
    │                       │   │                       │
    │ • Karma overview      │   │ • Review queue        │
    │ • Task feed           │   │ • Post task form      │
    │ • Active tasks        │   │ • My tasks            │
    │ • Karma activity      │   │ • Mentor stats        │
    │ • Search & filters    │   │ • Pass/Flag actions   │
    └───────────────────────┘   └───────────────────────┘
                │                           │
                └───────────┬───────────────┘
                            ▼
            ┌───────────────────────────────┐
            │   Task Detail (/task/[id])    │
            │                               │
            │ • Full description            │
            │ • Senior info                 │
            │ • Stack & difficulty          │
            │ • Claim button (student)      │
            │ • Submit form (claimed)       │
            │ • Submission status           │
            └───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │  Profile (/profile/[id])      │
            │                               │
            │ • User avatar & bio           │
            │ • Skills showcase             │
            │ • Stats grid                  │
            │ • Karma activity timeline     │
            │ • Completed/Posted tasks      │
            │ • GitHub & email links        │
            └───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │  Leaderboard (/leaderboard)   │
            │                               │
            │ • Top 3 podium                │
            │ • Full rankings               │
            │ • Trend indicators            │
            │ • Time filters                │
            │ • Community stats             │
            └───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Arena (/arena/[id])         │
            │   [Experimental]              │
            │                               │
            │ • Live coding environment     │
            │ • WebSocket terminal          │
            │ • Task brief panel            │
            │ • Timer countdown             │
            │ • PoW completion              │
            └───────────────────────────────┘
```

## 🔗 Navigation Flow

### Student Journey
```
Landing → Auth (Student) → Dashboard → Task Detail → Submit → Profile → Leaderboard
                                ↓
                          Active Tasks
                                ↓
                          Karma Activity
                                ↓
                          Referral Unlock (500 Karma)
```

### Senior Journey
```
Landing → Auth (Senior) → Dashboard → Review Queue → Approve/Flag
                              ↓
                         Post Task
                              ↓
                         My Tasks
                              ↓
                         Mentor Score
```

## 📄 Page Details

### Public Pages (No Auth Required)
| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/` | Landing | Marketing, How It Works, CTA |
| `/auth` | Login/Signup | Role selection, Quick demo login |

### Protected Pages (Auth Required)
| Route | Role | Purpose | Key Features |
|-------|------|---------|--------------|
| `/dashboard` | Student | Main hub | Task feed, Karma overview, Active tasks |
| `/dashboard/senior` | Senior | Main hub | Review queue, Post tasks, Mentor stats |
| `/task/[id]` | Both | Task details | Description, Claim, Submit |
| `/profile/[id]` | Both | User profile | Stats, Karma activity, Tasks |
| `/leaderboard` | Both | Rankings | Top 3, Full list, Trends |
| `/arena/[id]` | Student | Live coding | Terminal, Timer, PoW |

## 🎨 Component Reuse

### Shared Components
- `HandDrawnFilters` — Used on all pages
- `Highlight` — Landing, Dashboard, Task, Profile
- `KarmaBadge` — Dashboard, Profile, Leaderboard
- `DifficultyBadge` — Task, Dashboard, Profile
- `StatusPill` — Task, Dashboard
- `SketchButton` — Landing, Auth, Task
- `SketchInput` — Auth, Senior Dashboard, Task

### Layout Structure
```
RootLayout (layout.tsx)
  ├── AuthProvider
  │   ├── Navbar (conditional)
  │   └── Page Content
  └── HandDrawnFilters (SVG defs)
```

## 🔐 Auth States

### Unauthenticated
- Can view: `/`, `/auth`
- Redirected from: All other pages → `/auth`

### Authenticated (Student)
- Can view: All pages
- Default dashboard: `/dashboard`
- Can claim tasks, submit work, view karma

### Authenticated (Senior)
- Can view: All pages
- Default dashboard: `/dashboard/senior`
- Can post tasks, review submissions, view mentor score

## 📱 Responsive Breakpoints

```css
/* Mobile First */
Base: 320px+
sm:  640px+  (Tablet)
md:  768px+  (Desktop)
lg:  1024px+ (Large Desktop)
xl:  1280px+ (Extra Large)
```

### Mobile Adaptations
- Navbar: Hamburger menu (hidden on mobile)
- Grid: 1 column → 2 columns → 3 columns
- Stats: Stacked → Side-by-side
- Task cards: Full width → Grid

## 🎯 Call-to-Action Flow

```
Landing CTA → Auth → Dashboard → Task → Submit → Karma → Referral
     ↓
"I'm a Student" → Student Dashboard
     ↓
"I'm a Senior" → Senior Dashboard
```

## 🔄 State Management

### Global State (Context)
- `AuthContext` — User, login, logout, isLoading

### Local State (useState)
- Search queries
- Filter selections
- Form inputs
- Modal visibility

### URL State (useParams)
- Task ID
- User ID
- Arena ID

## 🚀 Performance Optimization

### Static Pages (Pre-rendered)
- `/` — Landing
- `/auth` — Auth
- `/dashboard` — Dashboard (shell)
- `/dashboard/senior` — Senior Dashboard (shell)
- `/leaderboard` — Leaderboard

### Dynamic Pages (Server-rendered)
- `/task/[id]` — Task detail
- `/profile/[id]` — User profile
- `/arena/[id]` — Arena

### Client-Side Only
- All data fetching (currently mock)
- Auth state management
- Form submissions

---

**Total Pages:** 8 main pages + 3 dynamic routes = 11 unique pages
**Total Components:** 20+ reusable components
**Total Routes:** 9 route patterns
