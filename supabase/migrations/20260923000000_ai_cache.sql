-- Migration: 20260923000000_ai_cache.sql
-- Persistent AI Cache to reduce LLM token usage and latency

CREATE TABLE IF NOT EXISTS public.ai_cache (
  cache_key TEXT PRIMARY KEY,
  cache_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  model_used TEXT DEFAULT 'gemini-2.5-flash',
  estimated_tokens_saved INTEGER DEFAULT 0,
  hit_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_hit_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes for fast lookups and cleanups
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup ON public.ai_cache (cache_key, expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_type ON public.ai_cache (cache_type, expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry ON public.ai_cache (expires_at);

-- Atomic hit counter RPC
CREATE OR REPLACE FUNCTION public.increment_cache_hit(
  p_cache_key TEXT,
  p_tokens_to_add INTEGER DEFAULT 500
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ai_cache
  SET
    hit_count = hit_count + 1,
    last_hit_at = now(),
    estimated_tokens_saved = estimated_tokens_saved + COALESCE(p_tokens_to_add, 500)
  WHERE cache_key = p_cache_key;
END;
$$;

-- Enable RLS
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon reads for valid cached items via server client
CREATE POLICY "Allow server-level reads on active cache"
  ON public.ai_cache
  FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Allow server-level inserts on cache"
  ON public.ai_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow server-level updates on cache"
  ON public.ai_cache
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
