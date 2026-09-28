-- Migration: 20260926000000_resume_matching_qa.sql
-- Description: Tables for automated resume matching, recommendations, and tailored Q&A banks.

CREATE TABLE IF NOT EXISTS resume_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_description TEXT NOT NULL,
  best_resume_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL,
  best_resume_label TEXT,
  match_score NUMERIC(5,2) NOT NULL,
  matched_skills JSONB DEFAULT '[]'::jsonb,
  missing_skills JSONB DEFAULT '[]'::jsonb,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('use_existing', 'tailor_new')),
  explanation TEXT NOT NULL,
  tailoring_suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_recommendations_user ON resume_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_recommendations_application ON resume_recommendations(application_id);

CREATE TABLE IF NOT EXISTS qa_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES resume_recommendations(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  resume_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL,
  total_questions INT DEFAULT 15,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_banks_user ON qa_banks(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_banks_application ON qa_banks(application_id);

ALTER TABLE resume_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_banks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'resume_recommendations' AND policyname = 'Users can manage own resume recommendations'
  ) THEN
    CREATE POLICY "Users can manage own resume recommendations"
      ON resume_recommendations
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qa_banks' AND policyname = 'Users can manage own qa banks'
  ) THEN
    CREATE POLICY "Users can manage own qa banks"
      ON qa_banks
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
