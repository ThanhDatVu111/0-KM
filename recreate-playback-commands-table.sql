-- Completely recreate playback_commands table with correct schema
-- WARNING: This will delete all existing data in the table

-- Drop existing table and all related objects
DROP TABLE IF EXISTS playback_commands CASCADE;

-- Create playback_commands table for mirror action approach
CREATE TABLE playback_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES room(room_id) ON DELETE CASCADE,
  command TEXT NOT NULL CHECK (command IN ('play', 'pause', 'next', 'previous', 'seek', 'volume')),
  track_uri TEXT,
  position_ms INTEGER CHECK (position_ms >= 0),
  volume INTEGER CHECK (volume >= 0 AND volume <= 100),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
  requested_by_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for efficient querying by room and time
  CONSTRAINT idx_playback_commands_room_time UNIQUE (room_id, created_at)
);

-- Create indexes for better performance
CREATE INDEX idx_playback_commands_room_id ON playback_commands(room_id);
CREATE INDEX idx_playback_commands_created_at ON playback_commands(created_at DESC);
CREATE INDEX idx_playback_commands_requested_by ON playback_commands(requested_by_user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE playback_commands ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see commands from rooms they're in
CREATE POLICY "Users can view playback commands from their rooms" ON playback_commands
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    )
  );

-- Policy: Users can only insert commands for rooms they're in
CREATE POLICY "Users can insert playback commands in their rooms" ON playback_commands
  FOR INSERT WITH CHECK (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    ) AND requested_by_user_id = auth.uid()
  );

-- Policy: Only system can delete commands (for cleanup)
CREATE POLICY "System can delete old playback commands" ON playback_commands
  FOR DELETE USING (false); -- Disable deletion for now, can be enabled later for cleanup jobs

-- Add trigger to automatically clean up old commands (keep last 100 per room)
CREATE OR REPLACE FUNCTION cleanup_old_playback_commands()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete commands older than the 100th most recent command for this room
  DELETE FROM playback_commands 
  WHERE room_id = NEW.room_id 
    AND created_at < (
      SELECT created_at 
      FROM playback_commands 
      WHERE room_id = NEW.room_id 
      ORDER BY created_at DESC 
      LIMIT 1 OFFSET 99
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup after each insert
CREATE TRIGGER trigger_cleanup_old_playback_commands
  AFTER INSERT ON playback_commands
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_playback_commands();

-- Grant necessary permissions
GRANT SELECT, INSERT ON playback_commands TO authenticated;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'playback_commands' 
ORDER BY ordinal_position; 