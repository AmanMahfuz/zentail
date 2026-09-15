-- Add to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS fit_score SMALLINT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS company_type VARCHAR(50);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS next_action_link VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS outcome VARCHAR(50);
-- outcome: 'offer', 'rejected', 'ghosted', null

-- Update status values to new stages
-- 'analyzing' | 'review_needed' | 'applied' | 'interviewing' | 'outcome'

-- New requirement maps table
CREATE TABLE IF NOT EXISTS requirement_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requirements JSONB NOT NULL DEFAULT '[]',
  matched_count SMALLINT DEFAULT 0,
  missing_count SMALLINT DEFAULT 0,
  partial_count SMALLINT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'generating',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(application_id)
);

-- Enable RLS
ALTER TABLE requirement_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requirement maps."
  ON requirement_maps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requirement maps."
  ON requirement_maps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requirement maps."
  ON requirement_maps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requirement maps."
  ON requirement_maps FOR DELETE
  USING (auth.uid() = user_id);

-- Weekly stats function
CREATE OR REPLACE FUNCTION get_weekly_stats(p_user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'new_this_week',
    COUNT(*) FILTER (
      WHERE created_at > NOW() - INTERVAL '7 days'
    )
  )
  FROM applications
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL;
