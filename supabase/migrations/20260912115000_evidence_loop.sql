-- Create user_projects table
CREATE TABLE user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  github_url VARCHAR(512),
  live_url VARCHAR(512),
  skills_demonstrated TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for user_projects
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects."
  ON user_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects."
  ON user_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects."
  ON user_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects."
  ON user_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_skills table for richer skill tracking (replacing string array in profiles)
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  proof_status VARCHAR(50) DEFAULT 'self_reported' CHECK (proof_status IN ('verified', 'linked', 'self_reported', 'learning', 'missing')),
  proof_description TEXT,
  proof_links TEXT[],
  years_experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, skill_name)
);

-- Enable RLS for user_skills
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skills."
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills."
  ON user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills."
  ON user_skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills."
  ON user_skills FOR DELETE
  USING (auth.uid() = user_id);

-- Add feedback field to applications for outcome tracking
ALTER TABLE applications ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS stage_reached VARCHAR(50);
