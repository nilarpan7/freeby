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

// ─── Quest Analysis Pipeline Types ───

export interface CriterionResult {
  criterion: string;
  passed: boolean;
  evidence: string;
}

export interface CodeError {
  file: string;
  line: number | null;
  severity: 'error' | 'warning' | 'info';
  message: string;
  category: string;
  suggestion?: string;
  fixed_code?: string;
}

export interface StructureReport {
  languages: string[];
  framework: string | null;
  has_readme: boolean;
  has_tests: boolean;
  has_package_json: boolean;
  file_count: number;
  project_type: string;
  entry_point: string | null;
}

export interface ErrorResolution {
  error_index: number;
  suggestion: string;
  fixed_code: string | null;
}

export interface QuestSubmission {
  id: string;
  student_id: string;
  quest_id: string;
  quest_type: 'starter' | 'solo';
  github_url: string;
  status: 'pending' | 'analyzing' | 'passed' | 'failed' | 'error';
  attempt_number: number;
  analysis_summary: string | null;
  criteria_results: CriterionResult[];
  error_report: CodeError[];
  structure_report: StructureReport;
  criteria_passed: number;
  criteria_total: number;
  karma_earned: number;
  score_pct: number;
  files_analyzed: number;
  analysis_duration_ms: number | null;
  model_used: string | null;
  created_at: string;
  completed_at: string | null;
  passes?: AnalysisPass[];
}

export interface AnalysisPass {
  id: string;
  submission_id: string;
  pass_number: number;
  pass_type: string;
  output_parsed: any;
  duration_ms: number;
  created_at: string;
}

export interface QuestStats {
  total_submissions: number;
  total_passed: number;
  total_failed: number;
  total_karma_earned: number;
  avg_score: number;
  quests_completed: string[];
}

export interface KarmaGraphEvent {
  type: string;
  title: string;
  delta: number;
}

export interface KarmaGraphDay {
  date: string;
  karma_earned: number;
  events: KarmaGraphEvent[];
  cumulative: number;
}

export interface KarmaGraphData {
  current_karma: number;
  daily_data: KarmaGraphDay[];
  recent_submissions: QuestSubmission[];
  total_events: number;
}

