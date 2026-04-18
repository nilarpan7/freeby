-- 1. Custom Types / Enums
CREATE TYPE user_role AS ENUM ('STUDENT', 'SENIOR');
CREATE TYPE domain_type AS ENUM ('Frontend', 'Backend', 'Data', 'DevOps', 'Design', 'Product', 'Other');
CREATE TYPE task_status AS ENUM ('OPEN', 'CLAIMED', 'IN_REVIEW', 'COMPLETED', 'REVISION_REQUESTED');
CREATE TYPE sprint_status AS ENUM ('FORMING', 'ACTIVE', 'COMPLETED');
CREATE TYPE squad_member_status AS ENUM ('JOINED', 'SUBMITTED');
CREATE TYPE attestation_type AS ENUM ('SOLO_TASK', 'SQUAD_SPRINT', 'PEER_ENDORSEMENT');
CREATE TYPE referral_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- 2. Tables

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  domain domain_type,
  skills TEXT[] DEFAULT '{}',
  karma_score INTEGER DEFAULT 0,
  is_verified_senior BOOLEAN DEFAULT false,
  avatar_url TEXT,
  github_url TEXT,
  bio TEXT,
  company TEXT,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SOLO TASKS
CREATE TABLE solo_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status task_status DEFAULT 'OPEN',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  submission_link TEXT,
  karma_reward INTEGER DEFAULT 10,
  stack TEXT[] DEFAULT '{}',
  difficulty difficulty_level DEFAULT 'easy',
  time_estimate_min INTEGER DEFAULT 60,
  min_karma INTEGER DEFAULT 0,
  reward_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SQUAD SPRINTS
CREATE TABLE squad_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  repo_link TEXT NOT NULL,
  status sprint_status DEFAULT 'FORMING',
  max_members INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SQUAD MEMBERS
CREATE TABLE squad_members (
  sprint_id UUID REFERENCES squad_sprints(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  peer_upvotes INTEGER DEFAULT 0,
  status squad_member_status DEFAULT 'JOINED',
  PRIMARY KEY (sprint_id, student_id)
);

-- ATTESTATIONS (Karma Graph / VC Log)
CREATE TABLE attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID,
  senior_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type attestation_type NOT NULL,
  on_chain_uid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- REFERRAL REQUESTS
CREATE TABLE referral_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  senior_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status referral_status DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BEST PRACTICES: Foreign Key Indexes
CREATE INDEX idx_solo_tasks_senior_id ON solo_tasks(senior_id);
CREATE INDEX idx_solo_tasks_assignee_id ON solo_tasks(assignee_id);
CREATE INDEX idx_squad_members_student_id ON squad_members(student_id);
CREATE INDEX idx_attestations_student_id ON attestations(student_id);
CREATE INDEX idx_attestations_senior_id ON attestations(senior_id);
CREATE INDEX idx_referral_requests_student_id ON referral_requests(student_id);
CREATE INDEX idx_referral_requests_senior_id ON referral_requests(senior_id);

-- 4. Row Level Security (RLS) Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_requests ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profiles" ON profiles FOR UPDATE USING ((SELECT auth.uid()) = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- Solo Tasks
CREATE POLICY "Anyone can read OPEN tasks" ON solo_tasks FOR SELECT USING (status = 'OPEN' OR (SELECT auth.uid()) = senior_id OR (SELECT auth.uid()) = assignee_id);
CREATE POLICY "Seniors can update their tasks" ON solo_tasks FOR UPDATE USING ((SELECT auth.uid()) = senior_id);
CREATE POLICY "Assignee can submit task" ON solo_tasks FOR UPDATE USING ((SELECT auth.uid()) = assignee_id) WITH CHECK (status IN ('CLAIMED', 'IN_REVIEW'));
CREATE POLICY "Seniors can insert tasks" ON solo_tasks FOR INSERT WITH CHECK ((SELECT auth.uid()) = senior_id);

-- Referral Requests
CREATE POLICY "Seniors can view referral requests directed to them" ON referral_requests FOR SELECT USING ((SELECT auth.uid()) = senior_id OR (SELECT auth.uid()) = student_id);
CREATE POLICY "Seniors can update referral requests" ON referral_requests FOR UPDATE USING ((SELECT auth.uid()) = senior_id);
CREATE POLICY "Students can create referral requests" ON referral_requests FOR INSERT WITH CHECK ((SELECT auth.uid()) = student_id);

-- Squad Sprints & Members
CREATE POLICY "Anyone can view sprints" ON squad_sprints FOR SELECT USING (true);
CREATE POLICY "Anyone can view squad members" ON squad_members FOR SELECT USING (true);
CREATE POLICY "Users can join sprints" ON squad_members FOR INSERT WITH CHECK ((SELECT auth.uid()) = student_id);

-- Attestations
CREATE POLICY "Anyone can view attestations" ON attestations FOR SELECT USING (true);

-- 5. Triggers and Functions

-- 500 Karma Referral Gate Trigger
CREATE OR REPLACE FUNCTION check_referral_karma_gate()
RETURNS TRIGGER AS $$
DECLARE
  student_karma INTEGER;
BEGIN
  SELECT karma_score INTO student_karma FROM profiles WHERE id = NEW.student_id;
  IF student_karma < 500 THEN
    RAISE EXCEPTION 'Insufficient Karma for referral. Required: 500, Current: %', student_karma;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_referral_karma_gate
BEFORE INSERT ON referral_requests
FOR EACH ROW
EXECUTE FUNCTION check_referral_karma_gate();

-- RPC: Approve Solo Task
CREATE OR REPLACE FUNCTION approve_solo_task(p_task_id UUID)
RETURNS VOID AS $$
DECLARE
  v_senior_id UUID;
  v_assignee_id UUID;
  v_karma_reward INTEGER;
BEGIN
  SELECT senior_id, assignee_id, karma_reward 
  INTO v_senior_id, v_assignee_id, v_karma_reward
  FROM solo_tasks WHERE id = p_task_id AND status = 'IN_REVIEW';
  
  IF v_senior_id IS NULL OR (SELECT auth.uid()) != v_senior_id THEN
    RAISE EXCEPTION 'Unauthorized or invalid task status';
  END IF;
  
  UPDATE solo_tasks SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = p_task_id;
  UPDATE profiles SET karma_score = karma_score + v_karma_reward WHERE id = v_assignee_id;
  INSERT INTO attestations (student_id, task_id, senior_id, type)
  VALUES (v_assignee_id, p_task_id, v_senior_id, 'SOLO_TASK');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Add Peer Upvote
CREATE OR REPLACE FUNCTION add_peer_upvote(p_sprint_id UUID, p_target_student_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM squad_members WHERE sprint_id = p_sprint_id AND student_id = (SELECT auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized: You are not part of this sprint';
  END IF;
  IF (SELECT auth.uid()) = p_target_student_id THEN
    RAISE EXCEPTION 'Cannot upvote yourself';
  END IF;
  UPDATE squad_members SET peer_upvotes = peer_upvotes + 1 WHERE sprint_id = p_sprint_id AND student_id = p_target_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
