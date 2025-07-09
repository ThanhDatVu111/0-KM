-- Create room_youtube_videos table for shared YouTube video functionality
-- Run this in your Supabase SQL editor if the table doesn't exist

CREATE TABLE IF NOT EXISTS room_youtube_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    video_id TEXT NOT NULL,
    added_by_user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_youtube_videos_room_id ON room_youtube_videos(room_id);
CREATE INDEX IF NOT EXISTS idx_room_youtube_videos_added_by ON room_youtube_videos(added_by_user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE room_youtube_videos ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see videos in their room
CREATE POLICY "Users can view videos in their room" ON room_youtube_videos
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM room 
            WHERE (user_1 = auth.uid() OR user_2 = auth.uid()) 
            AND filled = true
        )
    );

-- Policy to allow users to insert videos in their room
CREATE POLICY "Users can add videos to their room" ON room_youtube_videos
    FOR INSERT WITH CHECK (
        room_id IN (
            SELECT room_id FROM room 
            WHERE (user_1 = auth.uid() OR user_2 = auth.uid()) 
            AND filled = true
        )
        AND added_by_user_id = auth.uid()
    );

-- Policy to allow users to update videos they added
CREATE POLICY "Users can update videos they added" ON room_youtube_videos
    FOR UPDATE USING (added_by_user_id = auth.uid());

-- Policy to allow users to delete videos they added
CREATE POLICY "Users can delete videos they added" ON room_youtube_videos
    FOR DELETE USING (added_by_user_id = auth.uid());

-- Add trigger to update updated_at timestamp
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