-- Disable RLS for spotify_tokens table since it's only accessed by the backend
-- This allows the backend to insert/update tokens without authentication context

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own spotify tokens" ON spotify_tokens;
DROP POLICY IF EXISTS "Users can insert own spotify tokens" ON spotify_tokens;
DROP POLICY IF EXISTS "Users can update own spotify tokens" ON spotify_tokens;
DROP POLICY IF EXISTS "Users can delete own spotify tokens" ON spotify_tokens;

-- Disable RLS
ALTER TABLE spotify_tokens DISABLE ROW LEVEL SECURITY; 