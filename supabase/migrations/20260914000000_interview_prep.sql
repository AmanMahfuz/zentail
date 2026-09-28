-- Create interview_preps table
CREATE TABLE IF NOT EXISTS interview_preps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- The generated data
  topics JSONB NOT NULL DEFAULT '[]', -- Array of { title, time, icon, description, skills }
  signals JSONB NOT NULL DEFAULT '[]', -- Array of skill strings
  mock_questions JSONB NOT NULL DEFAULT '[]', -- Array of { question, answer_hints }
  
  status VARCHAR(50) DEFAULT 'ready',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(application_id)
);

-- Enable RLS
ALTER TABLE interview_preps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interview_preps"
  ON interview_preps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview_preps"
  ON interview_preps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview_preps"
  ON interview_preps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview_preps"
  ON interview_preps FOR DELETE
  USING (auth.uid() = user_id);
