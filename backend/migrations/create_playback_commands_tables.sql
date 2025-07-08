-- Create playback_commands table for remote control functionality
CREATE TABLE IF NOT EXISTS playback_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'play', 'pause', 'next', 'previous', 'play_track'
  track_uri TEXT, -- For play_track action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create playback_state table for synchronized state
CREATE TABLE IF NOT EXISTS playback_state (
  room_id TEXT PRIMARY KEY,
  is_playing BOOLEAN DEFAULT FALSE,
  current_track_uri TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playback_commands_room_id ON playback_commands(room_id);
CREATE INDEX IF NOT EXISTS idx_playback_commands_created_at ON playback_commands(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE playback_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playback_commands
-- Allow users to insert commands for rooms they're in
CREATE POLICY "Users can insert playback commands for their rooms" ON playback_commands
  FOR INSERT WITH CHECK (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    )
  );

-- Allow users to read commands for rooms they're in
CREATE POLICY "Users can read playback commands for their rooms" ON playback_commands
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    )
  );

-- RLS Policies for playback_state
-- Allow users to read state for rooms they're in
CREATE POLICY "Users can read playback state for their rooms" ON playback_state
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    )
  );

-- Allow users to update state for rooms they're in
CREATE POLICY "Users can update playback state for their rooms" ON playback_state
  FOR UPDATE USING (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    )
  );

-- Allow users to insert state for rooms they're in
CREATE POLICY "Users can insert playback state for their rooms" ON playback_state
  FOR INSERT WITH CHECK (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    )
  );

-- Enable real-time for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE playback_commands;
ALTER PUBLICATION supabase_realtime ADD TABLE playback_state; 