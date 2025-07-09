-- Temporarily disable RLS on room_spotify_tracks table for real-time testing
-- This is needed because the app uses Clerk for authentication, not Supabase Auth
-- The RLS policies check for auth.uid() which doesn't work with Clerk

-- Disable RLS on room_spotify_tracks table
ALTER TABLE room_spotify_tracks DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on playback_commands table if it exists
-- (This table is used for remote control commands)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playback_commands') THEN
        ALTER TABLE playback_commands DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Also disable RLS on playback_state table if it exists
-- (This table is used for shared playback state)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playback_state') THEN
        ALTER TABLE playback_state DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Note: This is a temporary fix for testing real-time functionality
-- In production, you should implement proper security measures
-- such as using service roles or implementing custom RLS policies
-- that work with Clerk authentication 