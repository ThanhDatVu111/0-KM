-- Fix playback_commands table column name
-- This migration renames the column from requested_by to requested_by_user_id

-- First, check if the table exists and has the old column
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'playback_commands') THEN
        -- Check if old column exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'playback_commands' AND column_name = 'requested_by') THEN
            -- Rename the column
            ALTER TABLE playback_commands RENAME COLUMN requested_by TO requested_by_user_id;
            RAISE NOTICE 'Column renamed from requested_by to requested_by_user_id';
        ELSE
            RAISE NOTICE 'Column requested_by does not exist, checking for requested_by_user_id';
        END IF;
        
        -- Check if new column exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'playback_commands' AND column_name = 'requested_by_user_id') THEN
            RAISE NOTICE 'Column requested_by_user_id exists';
        ELSE
            RAISE NOTICE 'Column requested_by_user_id does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'Table playback_commands does not exist';
    END IF;
END $$;

-- Drop the old index if it exists
DROP INDEX IF EXISTS idx_playback_commands_requested_by;

-- Create the new index
CREATE INDEX IF NOT EXISTS idx_playback_commands_requested_by ON playback_commands(requested_by_user_id);

-- Update RLS policies to use the new column name
DROP POLICY IF EXISTS "Users can insert playback commands in their rooms" ON playback_commands;

CREATE POLICY "Users can insert playback commands in their rooms" ON playback_commands
  FOR INSERT WITH CHECK (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    ) AND requested_by_user_id = auth.uid()
  );

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'playback_commands' 
ORDER BY ordinal_position; 