-- Create room-based YouTube videos table
CREATE TABLE IF NOT EXISTS room_youtube_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT,
    added_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster room lookups
CREATE INDEX IF NOT EXISTS idx_room_youtube_videos_room_id ON room_youtube_videos(room_id);

-- Disable RLS for backend access
ALTER TABLE room_youtube_videos DISABLE ROW LEVEL SECURITY;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_room_youtube_videos_updated_at 
    BEFORE UPDATE ON room_youtube_videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 