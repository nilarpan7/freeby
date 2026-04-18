-- ═══════════════════════════════════════════════════════════════
-- Migration: Agentic Code Analysis Pipeline + Referrals + Chat
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Add telegram_chat_id to profiles for notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- TASK REFERRALS — refer someone to a task
CREATE TABLE IF NOT EXISTS task_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES solo_tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',       -- pending | accepted | completed | rejected
  karma_earned_referrer INTEGER DEFAULT 0,      -- 10% of referred's karma on success
  karma_penalty_referrer INTEGER DEFAULT 0,     -- 5% of project karma on rejection
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(referrer_id, referred_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_referrals_referrer ON task_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_task_referrals_referred ON task_referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_task_referrals_task ON task_referrals(task_id);

ALTER TABLE task_referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read referrals' AND tablename = 'task_referrals') THEN
    CREATE POLICY "Public read referrals" ON task_referrals FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Insert referrals' AND tablename = 'task_referrals') THEN
    CREATE POLICY "Insert referrals" ON task_referrals FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Update referrals' AND tablename = 'task_referrals') THEN
    CREATE POLICY "Update referrals" ON task_referrals FOR UPDATE USING (true);
  END IF;
END $$;

-- QUEST SUBMISSIONS — tracks every submission attempt
CREATE TABLE IF NOT EXISTS quest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  quest_type TEXT NOT NULL DEFAULT 'starter',
  github_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_number INTEGER DEFAULT 1,

  -- Analysis results
  analysis_summary TEXT,
  criteria_results JSONB DEFAULT '[]',
  error_report JSONB DEFAULT '[]',
  structure_report JSONB DEFAULT '{}',

  -- Scores
  criteria_passed INTEGER DEFAULT 0,
  criteria_total INTEGER DEFAULT 0,
  karma_earned INTEGER DEFAULT 0,
  score_pct NUMERIC(5,2) DEFAULT 0,

  -- Metadata
  files_analyzed INTEGER DEFAULT 0,
  analysis_duration_ms INTEGER,
  model_used TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quest_submissions_student ON quest_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_quest_submissions_quest ON quest_submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_submissions_status ON quest_submissions(status);

-- ANALYSIS PASSES — each pass of the multi-step agentic pipeline
CREATE TABLE IF NOT EXISTS analysis_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES quest_submissions(id) ON DELETE CASCADE,
  pass_number INTEGER NOT NULL,
  pass_type TEXT NOT NULL,
  input_context TEXT,
  output_raw TEXT,
  output_parsed JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_passes_submission ON analysis_passes(submission_id);

-- KARMA HISTORY — tracks daily karma snapshots for the work graph
CREATE TABLE IF NOT EXISTS karma_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  karma_delta INTEGER NOT NULL,
  karma_total INTEGER NOT NULL,
  event_type TEXT NOT NULL,       -- 'quest_pass', 'quest_fail', 'task_complete', 'endorsement'
  event_ref_id UUID,              -- reference to quest_submissions.id or solo_tasks.id
  event_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_karma_history_student ON karma_history(student_id);
CREATE INDEX IF NOT EXISTS idx_karma_history_created ON karma_history(created_at);

-- RLS
ALTER TABLE quest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE karma_history ENABLE ROW LEVEL SECURITY;

-- Quest submissions policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students view own submissions' AND tablename = 'quest_submissions') THEN
    CREATE POLICY "Students view own submissions" ON quest_submissions FOR SELECT USING (student_id = (SELECT auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service insert submissions' AND tablename = 'quest_submissions') THEN
    CREATE POLICY "Service insert submissions" ON quest_submissions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service update submissions' AND tablename = 'quest_submissions') THEN
    CREATE POLICY "Service update submissions" ON quest_submissions FOR UPDATE USING (true);
  END IF;
END $$;

-- Analysis passes policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students view own passes' AND tablename = 'analysis_passes') THEN
    CREATE POLICY "Students view own passes" ON analysis_passes FOR SELECT
      USING (submission_id IN (SELECT id FROM quest_submissions WHERE student_id = (SELECT auth.uid())));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service insert passes' AND tablename = 'analysis_passes') THEN
    CREATE POLICY "Service insert passes" ON analysis_passes FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Karma history policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students view own karma history' AND tablename = 'karma_history') THEN
    CREATE POLICY "Students view own karma history" ON karma_history FOR SELECT USING (student_id = (SELECT auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public view karma history' AND tablename = 'karma_history') THEN
    CREATE POLICY "Public view karma history" ON karma_history FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service insert karma history' AND tablename = 'karma_history') THEN
    CREATE POLICY "Service insert karma history" ON karma_history FOR INSERT WITH CHECK (true);
  END IF;
END $$;
