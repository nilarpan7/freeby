# Kramic.sh — Quick Start Guide

Get the Kramic.sh platform running in under 5 minutes.

## 🚀 Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Try Demo Accounts

Click **"⚡ Quick Demo Login"** on the auth page and select:

**Student Account:**
- **Rahul Kumar** — 480 Karma, Backend Developer
- **Vikram Patel** — 520 Karma, Data Engineer (Referral Unlocked!)

**Senior Account:**
- **Priya Sharma** — Google, Backend Mentor
- **Arjun Mehta** — Razorpay, Frontend Mentor

## 🎯 User Flows to Test

### As a Student

1. **Browse Tasks**
   - Login as Rahul Kumar
   - See task feed with match scores
   - Filter by difficulty (Easy/Medium/Hard)
   - Search for specific technologies

2. **Claim a Task**
   - Click on any "Open" task
   - Read the full description
   - Click "Claim This Task"
   - Task moves to "My Active Tasks"

3. **Submit Work**
   - Go to Dashboard → My Active Tasks
   - Click on claimed task
   - Fill in GitHub link and description
   - Submit for review

4. **Check Karma Progress**
   - View karma ring (X / 500)
   - See recent karma activity
   - Check if referral unlocked (500+ Karma)

5. **View Leaderboard**
   - Click "Leaderboard" in nav
   - See top 3 podium
   - Check your ranking
   - View community stats

### As a Senior

1. **Review Submissions**
   - Login as Priya Sharma
   - Go to "Review Queue" tab
   - See pending submissions
   - Click to expand feedback form
   - Approve (+10 Karma) or Flag (-5 Karma)

2. **Post a Task**
   - Go to "Post Task" tab
   - Fill in title, description, stack
   - Set difficulty and time estimate
   - Click "Post Task"

3. **View Your Tasks**
   - Go to "My Tasks" tab
   - See all posted tasks
   - Check status (Open/Claimed/Submitted)
   - Click to view details

4. **Check Mentor Score**
   - View mentor score in navbar
   - See stats: Tasks Posted, Pending Reviews, Students Mentored

## 📱 Page Navigation

```
/                          → Landing page
/auth                      → Login/Signup
/auth?role=student         → Student signup
/auth?role=senior          → Senior signup

/dashboard                 → Student dashboard
/dashboard/senior          → Senior dashboard

/task/task-1               → Task detail (any task ID)
/profile/student-1         → Profile (any user ID)
/leaderboard               → Karma leaderboard

/arena/demo-arena          → Live coding arena (experimental)
```

## 🎨 Design Features to Notice

1. **Hand-Drawn Aesthetic**
   - Irregular borders (sketch effect)
   - Offset shadows
   - Animated highlights
   - Rough paper texture

2. **Micro-Interactions**
   - Hover effects on cards
   - Button shadow animations
   - Progress ring animations
   - Karma pulse effect

3. **Responsive Design**
   - Mobile-friendly navigation
   - Adaptive grid layouts
   - Touch-optimized buttons

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Linting
npm run lint             # Run ESLint
```

## 📊 Mock Data Overview

The app uses mock data from `src/lib/mock-data.ts`:

- **3 Seniors** (Google, Razorpay, Microsoft)
- **5 Students** (Karma: 160-520)
- **8 Tasks** (Various statuses)
- **10 Karma Events**

All data is client-side only. Changes won't persist on refresh.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Check for errors
npm run build

# If errors persist, check:
# - All imports are correct
# - No missing dependencies
# - TypeScript version is 5.x
```

## 🚢 Next Steps

1. **Explore the UI** — Click around, test all features
2. **Read the PRD** — See `KRAMIC_PRD.md` for full vision
3. **Check Implementation** — See `IMPLEMENTATION_SUMMARY.md` for status
4. **Connect Backend** — Follow integration guide in summary doc

## 📞 Need Help?

- **Frontend Issues:** Check `frontend/README.md`
- **Design System:** See `frontend/src/components/HandDrawn.tsx`
- **Type Definitions:** See `frontend/src/lib/types.ts`
- **Mock Data:** See `frontend/src/lib/mock-data.ts`

---

**Happy Building! 🎯**

The Resume is Dead. Long Live Karma.
