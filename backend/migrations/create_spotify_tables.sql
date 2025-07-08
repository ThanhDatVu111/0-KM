-- Create Spotify tables for 0-KM app

-- Table for storing individual user's Spotify tracks (legacy support)
CREATE TABLE IF NOT EXISTS spotify_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    track_name TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    album_name TEXT NOT NULL,
    album_art_url TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    track_uri TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing room-based Spotify tracks (new shared experience)
CREATE TABLE IF NOT EXISTS room_spotify_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    track_name TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    album_name TEXT NOT NULL,
    album_art_url TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    track_uri TEXT NOT NULL,
    added_by_user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing Spotify user tokens (for future Spotify API integration)
CREATE TABLE IF NOT EXISTS spotify_user_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotify_tracks_user_id ON spotify_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_tracks_created_at ON spotify_tracks(created_at);

CREATE INDEX IF NOT EXISTS idx_room_spotify_tracks_room_id ON room_spotify_tracks(room_id);
CREATE INDEX IF NOT EXISTS idx_room_spotify_tracks_created_at ON room_spotify_tracks(created_at);
CREATE INDEX IF NOT EXISTS idx_room_spotify_tracks_added_by_user_id ON room_spotify_tracks(added_by_user_id);

CREATE INDEX IF NOT EXISTS idx_spotify_user_tokens_user_id ON spotify_user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_user_tokens_expires_at ON spotify_user_tokens(expires_at);

-- Add comments for documentation
COMMENT ON TABLE spotify_tracks IS 'Stores individual user Spotify tracks (legacy)';
COMMENT ON TABLE room_spotify_tracks IS 'Stores room-based Spotify tracks for shared music experience';
COMMENT ON TABLE spotify_user_tokens IS 'Stores Spotify OAuth tokens for API access';

-- Add RLS (Row Level Security) policies for security
ALTER TABLE spotify_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_spotify_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_user_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for spotify_tracks (users can only access their own tracks)
CREATE POLICY "Users can view their own spotify tracks" ON spotify_tracks
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own spotify tracks" ON spotify_tracks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own spotify tracks" ON spotify_tracks
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own spotify tracks" ON spotify_tracks
    FOR DELETE USING (auth.uid()::text = user_id);

-- RLS policies for room_spotify_tracks (users can access tracks in their rooms)
CREATE POLICY "Users can view room spotify tracks" ON room_spotify_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room 
            WHERE room_id = room_spotify_tracks.room_id 
            AND (user_1 = auth.uid()::text OR user_2 = auth.uid()::text)
            AND filled = true
        )
    );

CREATE POLICY "Users can insert room spotify tracks" ON room_spotify_tracks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM room 
            WHERE room_id = room_spotify_tracks.room_id 
            AND (user_1 = auth.uid()::text OR user_2 = auth.uid()::text)
            AND filled = true
        )
        AND added_by_user_id = auth.uid()::text
    );

CREATE POLICY "Users can update room spotify tracks" ON room_spotify_tracks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM room 
            WHERE room_id = room_spotify_tracks.room_id 
            AND (user_1 = auth.uid()::text OR user_2 = auth.uid()::text)
            AND filled = true
        )
    );

CREATE POLICY "Users can delete room spotify tracks" ON room_spotify_tracks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM room 
            WHERE room_id = room_spotify_tracks.room_id 
            AND (user_1 = auth.uid()::text OR user_2 = auth.uid()::text)
            AND filled = true
        )
    );

-- RLS policies for spotify_user_tokens (users can only access their own tokens)
CREATE POLICY "Users can view their own spotify tokens" ON spotify_user_tokens
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own spotify tokens" ON spotify_user_tokens
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own spotify tokens" ON spotify_user_tokens
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own spotify tokens" ON spotify_user_tokens
    FOR DELETE USING (auth.uid()::text = user_id); 

-- Enable real-time for room_spotify_tracks table
ALTER PUBLICATION supabase_realtime ADD TABLE room_spotify_tracks;

-- NOTE: Since this app uses Clerk for authentication instead of Supabase Auth,
-- the RLS policies above may block real-time subscriptions. For testing,
-- you can temporarily disable RLS on the room_spotify_tracks table:
-- ALTER TABLE room_spotify_tracks DISABLE ROW LEVEL SECURITY; 