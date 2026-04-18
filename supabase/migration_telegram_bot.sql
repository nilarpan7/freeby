-- Migration: Add micro_tasks JSONB column and make senior_id nullable
-- Run this against your Supabase SQL editor

-- 1. Add micro_tasks column to store task decomposition from LangChain
ALTER TABLE solo_tasks ADD COLUMN IF NOT EXISTS micro_tasks JSONB DEFAULT '[]'::jsonb;

-- 2. Add client_telegram_id to track who created the task via Telegram
ALTER TABLE solo_tasks ADD COLUMN IF NOT EXISTS client_telegram_id BIGINT;

-- 3. Add client_name for display purposes
ALTER TABLE solo_tasks ADD COLUMN IF NOT EXISTS client_name TEXT;

-- 4. Add figma_url as a dedicated column instead of reusing submission_link
ALTER TABLE solo_tasks ADD COLUMN IF NOT EXISTS figma_url TEXT;

-- 5. Make senior_id nullable (it already allows NULL based on seed.sql working without it)
-- This is a no-op if it's already nullable, but let's be explicit:
ALTER TABLE solo_tasks ALTER COLUMN senior_id DROP NOT NULL;

-- 6. Add a permissive INSERT policy for the Telegram bot (service-role key bypasses RLS,
--    but if using anon key we need this):
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow bot inserts' AND tablename = 'solo_tasks'
  ) THEN
    CREATE POLICY "Allow bot inserts" ON solo_tasks FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

-- 7. Allow anyone to read all tasks (not just OPEN ones) for the bot confirmation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read all tasks' AND tablename = 'solo_tasks'
  ) THEN
    CREATE POLICY "Allow public read all tasks" ON solo_tasks FOR SELECT USING (true);
  END IF;
END
$$;
