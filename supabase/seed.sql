-- Seed script for Kramic.sh Supabase
-- Run this AFTER schema.sql

-- 1. Create some demo Senior Profiles (Need to be manually linked to auth.users if testing auth)
-- For demo purposes, we'll assume these IDs exist or we'll just insert them into profiles.
-- Note: In a real app, profiles are created via trigger or on sign-up.

-- 2. Insert Tasks
INSERT INTO solo_tasks (title, description, stack, difficulty, time_estimate_min, min_karma, reward_amount, karma_reward, status)
VALUES 
('Build a regex log parser', 'Write a Python script that takes an nginx access.log file and extracts all unique IP addresses, response codes, and timestamps.', ARRAY['Python', 'Regex'], 'easy', 90, 0, 1500, 10, 'OPEN'),
('React component: Sortable data table', 'Create a reusable React component that renders a data table with sortable columns, pagination, and a search filter.', ARRAY['React', 'TypeScript', 'Tailwind'], 'medium', 180, 50, 3000, 20, 'OPEN'),
('Clean & transform messy CSV dataset', 'Given a raw CSV with 50,000 rows of e-commerce transaction data, clean it and normalize date formats.', ARRAY['Python', 'Pandas', 'SQL'], 'easy', 120, 0, 1200, 10, 'OPEN'),
('REST API with auth middleware', 'Build a FastAPI application with JWT authentication and Pydantic validation.', ARRAY['Python', 'FastAPI', 'JWT'], 'medium', 240, 100, 4500, 25, 'OPEN'),
('Dockerize a Node.js microservice', 'Create a production-ready Docker setup with multi-stage builds and docker-compose.', ARRAY['Docker', 'Node.js', 'CI/CD'], 'hard', 180, 200, 5000, 40, 'OPEN');

-- 3. Insert Sprints
INSERT INTO squad_sprints (title, description, repo_link, status, max_members)
VALUES 
('Nebula UI Library', 'Collaborative effort to build a high-performance liquid glass component library.', 'https://github.com/kramic/nebula', 'FORMING', 4),
('Data Sentinel', 'Building a real-time fraud detection pipeline for e-commerce logs.', 'https://github.com/kramic/sentinel', 'ACTIVE', 5);
