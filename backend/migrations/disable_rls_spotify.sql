-- Disable Row Level Security for room_spotify_tracks table
-- This allows the application to insert/update/delete records without authentication context

ALTER TABLE room_spotify_tracks DISABLE ROW LEVEL SECURITY;

-- Add a comment to document why RLS is disabled
COMMENT ON TABLE room_spotify_tracks IS 'RLS disabled - application handles authorization at the service layer'; 