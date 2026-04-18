// Kramic.sh — Mock Data Store
// Full demo data so the frontend works standalone without a backend

import { User, Task, KarmaEvent, TaskSubmission, ReferralRequest, LeaderboardEntry } from './types';

// ─── USERS ─────────────────────────────────────────────────────────────
export const MOCK_CLIENTS: User[] = [
  {
    id: 'client-1',
    name: 'Priya Sharma',
    email: 'priya@google.com',
    role: 'client',
    domain: 'Backend',
    skills: ['Go', 'Kubernetes', 'gRPC', 'PostgreSQL'],
    karma_score: 0,
    avatar_url: '',
    github_url: 'https://github.com/priyasharma',
    company: 'Google',
    profile_completed: true,
    tasks_completed: 0,
    tasks_posted: 12,
    created_at: '2025-09-15T10:00:00Z',
  },
  {
    id: 'client-2',
    name: 'Arjun Mehta',
    email: 'arjun@razorpay.com',
    role: 'client',
    domain: 'Frontend',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind'],
    karma_score: 0,
    avatar_url: '',
    github_url: 'https://github.com/arjunmehta',
    company: 'Razorpay',
    profile_completed: true,
    tasks_completed: 0,
    tasks_posted: 8,
    created_at: '2025-10-02T10:00:00Z',
  },
  {
    id: 'client-3',
    name: 'Sneha Gupta',
    email: 'sneha@microsoft.com',
    role: 'client',
    domain: 'Data',
    skills: ['Python', 'Pandas', 'SQL', 'Spark'],
    karma_score: 0,
    avatar_url: '',
    github_url: 'https://github.com/snehagupta',
    company: 'Microsoft',
    profile_completed: true,
    tasks_completed: 0,
    tasks_posted: 15,
    created_at: '2025-08-20T10:00:00Z',
  },
];

export const MOCK_STUDENTS: User[] = [
  {
    id: 'student-1',
    name: 'Rahul Kumar',
    email: 'rahul@mail.com',
    role: 'student',
    domain: 'Backend',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    karma_score: 480,
    avatar_url: '',
    github_url: 'https://github.com/rahulkumar',
    profile_completed: true,
    tasks_completed: 42,
    tasks_posted: 0,
    created_at: '2025-11-01T10:00:00Z',
  },
  {
    id: 'student-2',
    name: 'Ananya Singh',
    email: 'ananya@mail.com',
    role: 'student',
    domain: 'Frontend',
    skills: ['React', 'TypeScript', 'CSS', 'Figma'],
    karma_score: 350,
    avatar_url: '',
    github_url: 'https://github.com/ananyasingh',
    profile_completed: true,
    tasks_completed: 31,
    tasks_posted: 0,
    created_at: '2025-11-15T10:00:00Z',
  },
  {
    id: 'student-3',
    name: 'Vikram Patel',
    email: 'vikram@mail.com',
    role: 'student',
    domain: 'Data',
    skills: ['Python', 'Pandas', 'SQL', 'Matplotlib'],
    karma_score: 520,
    avatar_url: '',
    github_url: 'https://github.com/vikrampatel',
    profile_completed: true,
    tasks_completed: 48,
    tasks_posted: 0,
    created_at: '2025-10-20T10:00:00Z',
  },
  {
    id: 'student-4',
    name: 'Deepika Reddy',
    email: 'deepika@mail.com',
    role: 'student',
    domain: 'DevOps',
    skills: ['Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    karma_score: 290,
    avatar_url: '',
    github_url: 'https://github.com/deepikareddy',
    profile_completed: true,
    tasks_completed: 25,
    tasks_posted: 0,
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 'student-5',
    name: 'Amit Joshi',
    email: 'amit@mail.com',
    role: 'student',
    domain: 'Backend',
    skills: ['Node.js', 'Express', 'MongoDB', 'Redis'],
    karma_score: 160,
    avatar_url: '',
    github_url: 'https://github.com/amitjoshi',
    profile_completed: true,
    tasks_completed: 14,
    tasks_posted: 0,
    created_at: '2026-01-10T10:00:00Z',
  },
];

// ─── TASKS ─────────────────────────────────────────────────────────────
export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Build a regex log parser',
    description: 'Write a Python script that takes an nginx access.log file and extracts all unique IP addresses, response codes, and timestamps. Output should be a clean CSV with columns: ip, status_code, timestamp, request_path. Handle edge cases like malformed lines gracefully.',
    stack: ['Python', 'Regex'],
    difficulty: 'easy',
    time_estimate_min: 90,
    client_id: 'client-1',
    client_name: 'Priya Sharma',
    client_company: 'Google',
    status: 'open',
    match_score: 95,
    created_at: '2026-04-15T10:00:00Z',
  },
  {
    id: 'task-2',
    title: 'React component: Sortable data table',
    description: 'Create a reusable React component that renders a data table with sortable columns, pagination (10/25/50 per page), and a search filter. Use TypeScript. No external table libraries — build from scratch. Style with Tailwind CSS.',
    stack: ['React', 'TypeScript', 'Tailwind'],
    difficulty: 'medium',
    time_estimate_min: 180,
    client_id: 'client-2',
    client_name: 'Arjun Mehta',
    client_company: 'Razorpay',
    status: 'open',
    match_score: 88,
    created_at: '2026-04-15T12:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Clean & transform messy CSV dataset',
    description: 'Given a raw CSV with 50,000 rows of e-commerce transaction data, clean it: remove duplicates, handle null values (fill or drop with justification), normalize date formats to ISO 8601, and create a summary report showing top 10 products by revenue.',
    stack: ['Python', 'Pandas', 'SQL'],
    difficulty: 'easy',
    time_estimate_min: 120,
    client_id: 'client-3',
    client_name: 'Sneha Gupta',
    client_company: 'Microsoft',
    status: 'open',
    match_score: 92,
    created_at: '2026-04-14T09:00:00Z',
  },
  {
    id: 'task-4',
    title: 'REST API with auth middleware',
    description: 'Build a FastAPI application with JWT authentication. Implement: POST /register, POST /login, GET /me (protected), GET /users (admin only). Use SQLite for storage. Include proper error handling, input validation with Pydantic, and rate limiting.',
    stack: ['Python', 'FastAPI', 'JWT', 'SQLite'],
    difficulty: 'medium',
    time_estimate_min: 240,
    client_id: 'client-1',
    client_name: 'Priya Sharma',
    client_company: 'Google',
    status: 'claimed',
    claimed_by: 'student-1',
    match_score: 97,
    created_at: '2026-04-13T14:00:00Z',
  },
  {
    id: 'task-5',
    title: 'Dockerize a Node.js microservice',
    description: 'Take the provided Express.js application and create a production-ready Docker setup: multi-stage Dockerfile, docker-compose.yml with Redis and PostgreSQL services, health check endpoint, and a GitHub Actions CI workflow that builds and pushes to GHCR.',
    stack: ['Docker', 'Node.js', 'CI/CD', 'GitHub Actions'],
    difficulty: 'hard',
    time_estimate_min: 180,
    client_id: 'client-1',
    client_name: 'Priya Sharma',
    client_company: 'Google',
    status: 'open',
    match_score: 78,
    created_at: '2026-04-16T08:00:00Z',
  },
  {
    id: 'task-6',
    title: 'Interactive chart dashboard',
    description: 'Build a dashboard page that visualizes sales data using Recharts. Include: line chart (revenue over time), bar chart (top categories), pie chart (market share), and a KPI summary row. All charts should be responsive. Add a date range filter.',
    stack: ['React', 'TypeScript', 'Recharts', 'Tailwind'],
    difficulty: 'medium',
    time_estimate_min: 150,
    client_id: 'client-2',
    client_name: 'Arjun Mehta',
    client_company: 'Razorpay',
    status: 'submitted',
    claimed_by: 'student-2',
    submission: {
      id: 'sub-1',
      task_id: 'task-6',
      student_id: 'student-2',
      student_name: 'Ananya Singh',
      github_link: 'https://github.com/ananyasingh/chart-dashboard',
      submission_text: 'Implemented all 4 chart types with responsive containers. Added a date range filter with react-datepicker. Used Tailwind for styling.',
      status: 'pending',
      submitted_at: '2026-04-16T18:00:00Z',
    },
    match_score: 91,
    created_at: '2026-04-12T11:00:00Z',
  },
  {
    id: 'task-7',
    title: 'SQL optimization challenge',
    description: 'Given a slow PostgreSQL query that takes 12 seconds on a 5M row table, optimize it to run under 200ms. Provide: the optimized query, EXPLAIN ANALYZE output before/after, and a brief writeup of the indexing strategy you used.',
    stack: ['SQL', 'PostgreSQL'],
    difficulty: 'hard',
    time_estimate_min: 120,
    client_id: 'client-3',
    client_name: 'Sneha Gupta',
    client_company: 'Microsoft',
    status: 'approved',
    claimed_by: 'student-3',
    submission: {
      id: 'sub-2',
      task_id: 'task-7',
      student_id: 'student-3',
      student_name: 'Vikram Patel',
      github_link: 'https://github.com/vikrampatel/sql-optimization',
      submission_text: 'Created a composite index on (user_id, created_at) and rewrote the subquery as a CTE. Query now runs in 85ms.',
      status: 'approved',
      client_feedback: 'Excellent work. Clean approach, good use of CTEs, and the EXPLAIN analysis was thorough.',
      submitted_at: '2026-04-14T20:00:00Z',
      reviewed_at: '2026-04-15T09:00:00Z',
    },
    match_score: 85,
    created_at: '2026-04-10T16:00:00Z',
  },
  {
    id: 'task-8',
    title: 'Terraform infrastructure module',
    description: 'Write a Terraform module that provisions an AWS VPC with public/private subnets, NAT gateway, and an ALB. Include variables for CIDR ranges, region, and environment name. Output the VPC ID, subnet IDs, and ALB DNS name.',
    stack: ['Terraform', 'AWS', 'Networking'],
    difficulty: 'hard',
    time_estimate_min: 200,
    client_id: 'client-1',
    client_name: 'Priya Sharma',
    client_company: 'Google',
    status: 'open',
    match_score: 72,
    created_at: '2026-04-16T15:00:00Z',
  },
];

// ─── KARMA EVENTS ──────────────────────────────────────────────────────
export const MOCK_KARMA_EVENTS: KarmaEvent[] = [
  { id: 'ke-1', user_id: 'student-1', event_type: 'task_approved', karma_delta: 10, task_id: 'task-prev-1', task_title: 'CLI tool for file renaming', description: 'Task approved by Priya Sharma (Google)', created_at: '2026-04-14T10:00:00Z' },
  { id: 'ke-2', user_id: 'student-1', event_type: 'task_approved', karma_delta: 10, task_id: 'task-prev-2', task_title: 'REST API endpoint testing', description: 'Task approved by Sneha Gupta (Microsoft)', created_at: '2026-04-12T15:00:00Z' },
  { id: 'ke-3', user_id: 'student-1', event_type: 'task_flagged', karma_delta: -5, task_id: 'task-prev-3', task_title: 'Database migration script', description: 'Flagged: Code did not handle edge cases', created_at: '2026-04-10T09:00:00Z' },
  { id: 'ke-4', user_id: 'student-1', event_type: 'task_approved', karma_delta: 10, task_id: 'task-prev-4', task_title: 'WebSocket chat server', description: 'Task approved by Arjun Mehta (Razorpay)', created_at: '2026-04-08T17:00:00Z' },
  { id: 'ke-5', user_id: 'student-1', event_type: 'peer_upvote', karma_delta: 4, description: 'Peer upvote from Ananya Singh after Sprint #12', created_at: '2026-04-06T12:00:00Z' },
  { id: 'ke-6', user_id: 'student-3', event_type: 'task_approved', karma_delta: 10, task_id: 'task-7', task_title: 'SQL optimization challenge', description: 'Task approved by Sneha Gupta (Microsoft)', created_at: '2026-04-15T09:00:00Z' },
  { id: 'ke-7', user_id: 'student-2', event_type: 'task_approved', karma_delta: 10, task_id: 'task-prev-5', task_title: 'Responsive landing page', description: 'Task approved by Arjun Mehta (Razorpay)', created_at: '2026-04-13T11:00:00Z' },
  { id: 'ke-8', user_id: 'student-3', event_type: 'production_deploy', karma_delta: 50, task_id: 'task-prev-6', task_title: 'Data pipeline PR merged to main', description: 'PR merged to production at Microsoft partner repo', created_at: '2026-04-11T20:00:00Z' },
  { id: 'ke-9', user_id: 'student-4', event_type: 'task_approved', karma_delta: 10, task_id: 'task-prev-7', task_title: 'Docker Compose setup', description: 'Task approved by Priya Sharma (Google)', created_at: '2026-04-09T14:00:00Z' },
  { id: 'ke-10', user_id: 'student-5', event_type: 'task_approved', karma_delta: 10, task_id: 'task-prev-8', task_title: 'Express middleware', description: 'Task approved by Arjun Mehta (Razorpay)', created_at: '2026-04-07T16:00:00Z' },
];

// ─── LEADERBOARD ───────────────────────────────────────────────────────
export function getLeaderboard(): LeaderboardEntry[] {
  const sorted = [...MOCK_STUDENTS].sort((a, b) => b.karma_score - a.karma_score);
  return sorted.map((user, i) => ({
    rank: i + 1,
    user,
    trend: i === 0 ? 'up' : i === 1 ? 'stable' : i % 2 === 0 ? 'up' : 'down',
    tasks_this_week: Math.floor(Math.random() * 5) + 1,
  }));
}

// ─── HELPERS ───────────────────────────────────────────────────────────
export function getUserById(id: string): User | undefined {
  return [...MOCK_STUDENTS, ...MOCK_CLIENTS].find(u => u.id === id);
}

export function getTaskById(id: string): Task | undefined {
  return MOCK_TASKS.find(t => t.id === id);
}

export function getTasksByClient(clientId: string): Task[] {
  return MOCK_TASKS.filter(t => t.client_id === clientId);
}

export function getKarmaEvents(userId: string): KarmaEvent[] {
  return MOCK_KARMA_EVENTS.filter(e => e.user_id === userId);
}

export function getOpenTasks(): Task[] {
  return MOCK_TASKS.filter(t => t.status === 'open');
}

export function getPendingReviews(clientId: string): Task[] {
  return MOCK_TASKS.filter(t => t.client_id === clientId && t.status === 'submitted');
}
