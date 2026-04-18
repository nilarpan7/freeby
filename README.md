# ⚡ Kramic.sh

> The Resume is Dead. Your Work Graph is Your Identity.

Kramic.sh is a Work-Verification Protocol that bridges the gap between students and top-tier clients. It replaces traditional resumes with verifiable code contributions, a robust karma score system, and a strong trackable work graph.

## ✨ Features

- **College-Blind Profiles:** Let your code speak for you. Build your profile entirely based on tasks you complete.
- **Karma System:** Complete tasks to earn non-transferable, time-decaying karma.
- **Micro-Tasks Marketplace:** Clients post real-world micro-tasks, students claim and submit solutions to get approved.
- **Squad Sprints:** Real-time collaboration spaces.
- **AI Telegram Bot:** A LangChain-powered assistant that fetches, analyzes, and lists project requirements interactively from a Telegram chat.
- **Hand-Drawn UI Aesthetic:** A unique "2B pencil sketch" aesthetic that feels organic and welcoming.

## 🛠 Tech Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (React, TypeScript)
- [TailwindCSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) (Smooth animations)
- [Lucide React](https://lucide.dev/) (Icons)

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- [LangChain](https://www.langchain.com/) (AI-assisted task parsing)
- [Supabase](https://supabase.com/) (PostgreSQL & Authentication)

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (v18+)
- Python (3.10+)
- [Supabase](https://supabase.com/) account (for real database support)

### Supabase Setup
1. Create a new Supabase project.
2. Run the SQL scripts found in the `supabase/` folder via your Supabase SQL Editor to set up your schema, policies, and seed data:
   - `schema.sql`
   - `migration_telegram_bot.sql`
   - `seed.sql`

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Fill in variables such as Supabase credentials, Telegram bot token, OpenAI keys, etc.
5. Start the backend server:
   ```bash
   python run.py
   ```
   *The server will be running at `http://127.0.0.1:8000`*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and API endpoints. 
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:3000`*

## 🤖 Telegram AI Bot

Kramic.sh includes a Telegram bot that clients can use to create tasks conversationally.
- Go to Telegram and set up a new bot via [BotFather](https://core.telegram.org/bots#botfather).
- Add the retrieved `TELEGRAM_BOT_TOKEN` and your `OPENAI_API_KEY` to the `backend/.env` file.
- Run the bot script: 
  ```bash
  python backend/telegram_bot_v2.py
  ```

## 📂 Project Structure

```text
freeby/
├── frontend/             # Next.js Application
│   ├── src/app/          # App Router & Views
│   ├── src/components/   # React Components
│   └── src/lib/          # API & Utility functions
├── backend/              # FastAPI Application & Telegram Bot
│   ├── routes/           # API Endpoints
│   ├── database/         # Supabase client logic & schemas
│   └── telegram_bot_v2.py# AI Task Creation Bot (Langchain based)
└── supabase/             # Database Schemas & Migrations 
```

## 🤝 Contributing
Feel free to open a Pull Request! We appreciate ideas and contributions from the community to make building reputation easier for everyone.

## 📄 License
MIT
