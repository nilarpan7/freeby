-- ═══════════════════════════════════════════════════════════════
-- Migration: Task Chat & Messaging
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS task_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES solo_tasks(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_messages_task ON task_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_task_messages_created ON task_messages(created_at);

ALTER TABLE task_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read messages' AND tablename = 'task_messages') THEN
        CREATE POLICY "Public read messages" ON task_messages FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Insert messages' AND tablename = 'task_messages') THEN
        CREATE POLICY "Insert messages" ON task_messages FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Enable Realtime for task_messages
-- Important: Run this to allow subscriptions from the frontend
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'task_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE task_messages;
  END IF;
END $$;
