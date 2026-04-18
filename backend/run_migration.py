"""Run the migration SQL against Supabase using the management API (via postgrest rpc).

Since we only have the anon key, we'll use a workaround:
Execute raw SQL via the supabase-py client's rpc if available,
or just print the SQL for the user to run in the Supabase SQL Editor.
"""
import os
from dotenv import load_dotenv
load_dotenv()

MIGRATION_SQL = """
-- 1. Add micro_tasks column
ALTER TABLE solo_tasks ADD COLUMN IF NOT EXISTS micro_tasks JSONB DEFAULT '[]'::jsonb;

-- 2. Add client tracking columns  
ALTER TABLE solo_tasks ADD COLUMN IF NOT EXISTS client_telegram_id BIGINT;
ALTER TABLE solo_tasks ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE solo_tasks ADD COLUMN IF NOT EXISTS figma_url TEXT;

-- 3. Drop existing restrictive policies and replace with permissive ones
DROP POLICY IF EXISTS "Anyone can read OPEN tasks" ON solo_tasks;
DROP POLICY IF EXISTS "Seniors can insert tasks" ON solo_tasks;
DROP POLICY IF EXISTS "Allow bot inserts" ON solo_tasks;
DROP POLICY IF EXISTS "Allow public read all tasks" ON solo_tasks;

-- 4. Create permissive policies
CREATE POLICY "Allow public read all tasks" ON solo_tasks FOR SELECT USING (true);
CREATE POLICY "Allow bot inserts" ON solo_tasks FOR INSERT WITH CHECK (true);
"""

print("=" * 60)
print("  SUPABASE MIGRATION - Run in SQL Editor")
print("=" * 60)
print()
print("Go to: https://supabase.com/dashboard -> your project -> SQL Editor")
print("Paste and run the following SQL:")
print()
print("-" * 60)
print(MIGRATION_SQL)
print("-" * 60)
print()
print("After running, come back and start the bot with:")
print("  python telegram_bot_v2.py")
