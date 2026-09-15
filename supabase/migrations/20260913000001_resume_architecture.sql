-- ─────────────────────────────────────────────
-- CLEAN UP OLD TABLES (Drop CASCADE)
-- ─────────────────────────────────────────────
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS user_projects CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;

-- ─────────────────────────────────────────────
-- USER EVIDENCE BASE (structured, not PDF blob)
-- ─────────────────────────────────────────────

CREATE TABLE user_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Personal
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),
  linkedin_url VARCHAR(512),
  github_url VARCHAR(512),
  portfolio_url VARCHAR(512),

  -- Professional summary (latest)
  summary TEXT,

  -- Updated whenever user saves a new resume
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills (each as separate verified row)
CREATE TABLE evidence_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),  -- 'frontend', 'backend', 'tools', 'language'
  proof_status VARCHAR(50) DEFAULT 'self_reported',
  -- 'verified' | 'linked' | 'self_reported' | 'learning'
  proof_description TEXT,  -- "Used in 3 projects"
  years_experience DECIMAL(3,1),
  proficiency VARCHAR(50), -- 'beginner' | 'intermediate' | 'expert'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- Experience entries
CREATE TABLE evidence_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  location VARCHAR(255),
  description TEXT,       -- raw description
  bullets JSONB,          -- ["bullet 1", "bullet 2"]
  skills_used TEXT[],
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE evidence_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bullets JSONB,
  url VARCHAR(512),
  github_url VARCHAR(512),
  tech_stack TEXT[],
  start_date DATE,
  end_date DATE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Education
CREATE TABLE evidence_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  degree VARCHAR(255),
  institution VARCHAR(255),
  field_of_study VARCHAR(255),
  start_year INT,
  end_year INT,
  grade VARCHAR(50),
  is_current BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certifications
CREATE TABLE evidence_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  date_obtained DATE,
  credential_url VARCHAR(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- RESUME VERSIONS
-- ─────────────────────────────────────────────

CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Version info
  version_number INT NOT NULL DEFAULT 1,
  version_label VARCHAR(255),  -- "V1 Original", "V2 Tailored for TechCorp"
  is_latest BOOLEAN DEFAULT FALSE,  -- ⭐ only one can be true per user

  -- Origin
  origin_type VARCHAR(50) NOT NULL,
  -- 'upload' | 'built' | 'tailored' | 'manual_edit'
  parent_version_id UUID REFERENCES resume_versions(id),
  application_id UUID,  -- will add fkey below after apps table created

  -- Content (structured, not PDF blob)
  content JSONB NOT NULL,

  -- Presentation
  template_id VARCHAR(50) DEFAULT 'clean',
  -- 'clean' | 'modern' | 'minimal' | 'professional'

  -- File outputs
  pdf_url VARCHAR(512),
  docx_url VARCHAR(512),

  -- Tracking
  times_used INT DEFAULT 0,
  interviews_generated INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  saved_as_latest_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, version_number)
);

-- When user saves as latest, record what changed
CREATE TABLE resume_version_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version_id UUID REFERENCES resume_versions(id),
  to_version_id UUID REFERENCES resume_versions(id),
  changes JSONB,
  saved_by VARCHAR(50),  -- 'user' | 'ai'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table (links to specific resume version)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_description TEXT,
  job_link VARCHAR(512),

  -- Which resume version was used
  resume_version_id UUID REFERENCES resume_versions(id),

  -- Fit analysis
  fit_score SMALLINT,
  fit_level VARCHAR(20),  -- 'strong' | 'moderate' | 'weak'
  matched_skills TEXT[],
  partial_skills TEXT[],
  missing_skills TEXT[],
  critical_missing TEXT[],  -- blockers regardless of overall score
  fit_summary TEXT,
  improvements JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'analyzing',
  -- 'analyzing' | 'review_needed' | 'applied' | 'interviewing' | 'outcome'
  outcome VARCHAR(50),  -- 'offer' | 'rejected' | 'ghosted'
  next_action TEXT,
  next_action_link VARCHAR(255),

  company_type VARCHAR(50),  -- detected company type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE resume_versions 
ADD CONSTRAINT resume_versions_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES applications(id);

-- ─────────────────────────────────────────────
-- RLS POLICIES
-- ─────────────────────────────────────────────

ALTER TABLE user_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_version_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Helper to create policies efficiently for user_id tables
CREATE OR REPLACE FUNCTION create_user_policy(table_name text) RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE POLICY "Users can view their own data in %I" ON %I FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert their own data in %I" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their own data in %I" ON %I FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete their own data in %I" ON %I FOR DELETE USING (auth.uid() = user_id);
    ', table_name, table_name, table_name, table_name, table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

SELECT create_user_policy('user_evidence');
SELECT create_user_policy('evidence_skills');
SELECT create_user_policy('evidence_experience');
SELECT create_user_policy('evidence_projects');
SELECT create_user_policy('evidence_education');
SELECT create_user_policy('evidence_certifications');
SELECT create_user_policy('resume_versions');
SELECT create_user_policy('applications');

DROP FUNCTION create_user_policy(text);

-- Policies for resume_version_changes (which doesn't have a user_id column directly)
CREATE POLICY "Users can view their own version changes" ON resume_version_changes
FOR SELECT USING (
    from_version_id IN (SELECT id FROM resume_versions WHERE user_id = auth.uid()) OR
    to_version_id IN (SELECT id FROM resume_versions WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert their own version changes" ON resume_version_changes
FOR INSERT WITH CHECK (
    from_version_id IN (SELECT id FROM resume_versions WHERE user_id = auth.uid()) OR
    to_version_id IN (SELECT id FROM resume_versions WHERE user_id = auth.uid())
);

