// Kramic.sh — Core TypeScript Interfaces

export type UserRole = 'student' | 'client';
export type Domain = 'Frontend' | 'Backend' | 'Data' | 'DevOps';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TaskStatus = 'open' | 'claimed' | 'submitted' | 'approved' | 'flagged' | 'revision';
export type ReferralStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  domain?: Domain;  // Optional until profile setup
  skills: string[];
  karma_score: number;
  avatar_url: string;
  github_url: string;
  bio?: string;
  company?: string;       // Only for clients
  profile_completed: boolean;
  tasks_completed: number;
  tasks_posted: number;
  mentor_score?: number;
  endorsements_received?: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  stack: string[];
  difficulty: Difficulty;
  time_estimate_min: number;
  client_id: string;
  client_name: string;
  client_company: string;
  status: TaskStatus;
  claimed_by?: string;
  submission?: TaskSubmission;
  created_at: string;
  match_score?: number;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  student_id: string;
  student_name: string;
  github_link: string;
  submission_text: string;
  status: 'pending' | 'approved' | 'flagged' | 'revision';
  client_feedback?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface KarmaEvent {
  id: string;
  user_id: string;
  event_type: 'task_approved' | 'task_flagged' | 'sprint_complete' | 'peer_upvote' | 'production_deploy' | 'code_review';
  karma_delta: number;
  task_id?: string;
  task_title?: string;
  description: string;
  created_at: string;
}

export interface ReferralRequest {
  id: string;
  student_id: string;
  student_name: string;
  client_id: string;
  client_name: string;
  client_company: string;
  status: ReferralStatus;
  message: string;
  karma_at_request: number;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  trend: 'up' | 'down' | 'stable';
  tasks_this_week: number;
}
