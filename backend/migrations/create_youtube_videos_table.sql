-- Create youtube_videos table
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_youtube_videos_user_id ON youtube_videos(user_id);

-- Enable Row Level Security
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own youtube videos" ON youtube_videos
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own youtube videos" ON youtube_videos
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own youtube videos" ON youtube_videos
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own youtube videos" ON youtube_videos
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_youtube_videos_updated_at 
  BEFORE UPDATE ON youtube_videos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 