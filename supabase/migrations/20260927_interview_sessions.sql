-- ============================================================
-- INTERVIEW SESSIONS TABLE
-- ============================================================
-- Stores each interview practice session

DROP TABLE IF EXISTS interview_sessions CASCADE;
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Interview metadata
  mode TEXT NOT NULL CHECK (mode IN ('text', 'voice', 'reinforcement')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  duration_seconds INTEGER,
  
  -- Performance breakdown
  answers JSONB, -- Array of { questionId, text, score, feedback, duration_ms }
  overall_feedback TEXT,
  strengths TEXT[], -- Array of strength areas
  weaknesses TEXT[], -- Array of weakness areas
  
  -- Skill assessments
  skills_performed_well TEXT[], -- Skills demonstrated well
  skills_to_improve TEXT[], -- Skills that need work
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  CONSTRAINT unique_session_per_app_user UNIQUE(user_id, application_id, created_at)
);

-- Index for efficient queries
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_app_id ON interview_sessions(application_id);
CREATE INDEX idx_interview_sessions_created ON interview_sessions(created_at DESC);

-- Row Level Security
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interview sessions"
  ON interview_sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own interview sessions"
  ON interview_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own interview sessions"
  ON interview_sessions
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own interview sessions"
  ON interview_sessions
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- QA_BANKS TABLE (if not exists)
-- ============================================================
-- Stores Q&A banks generated for job applications

DROP TABLE IF EXISTS qa_banks CASCADE;
CREATE TABLE IF NOT EXISTS qa_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Questions
  questions JSONB NOT NULL, -- Array of { id, question, category, difficulty, followUp?, keywords?, expectedKeywords? }
  
  -- Metadata
  total_questions INTEGER GENERATED ALWAYS AS (jsonb_array_length(questions)) STORED,
  categories TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(application_id)
);

-- Index
CREATE INDEX idx_qa_banks_user_id ON qa_banks(user_id);
CREATE INDEX idx_qa_banks_app_id ON qa_banks(application_id);

-- Row Level Security
ALTER TABLE qa_banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own QA banks"
  ON qa_banks
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own QA banks"
  ON qa_banks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own QA banks"
  ON qa_banks
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- UPDATE APPLICATIONS TABLE
-- ============================================================
-- Add interview-related columns if they don't exist

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS qa_bank_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_interview_score INTEGER,
ADD COLUMN IF NOT EXISTS total_interview_sessions INTEGER DEFAULT 0;
