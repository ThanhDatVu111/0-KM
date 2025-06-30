-- Create spotify_tokens table
CREATE TABLE IF NOT EXISTS spotify_tokens (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_spotify_tokens_user_id ON spotify_tokens(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can view own spotify tokens" ON spotify_tokens
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own spotify tokens" ON spotify_tokens
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own spotify tokens" ON spotify_tokens
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own spotify tokens" ON spotify_tokens
  FOR DELETE USING (auth.uid()::text = user_id); 