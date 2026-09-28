ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS portfolio_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS intro_note_sent BOOLEAN DEFAULT false;
