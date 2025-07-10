-- Update existing playback_commands table to support mirror action approach
-- This migration modifies the existing table structure

-- 1. Add missing columns
ALTER TABLE public.playback_commands 
ADD COLUMN IF NOT EXISTS command TEXT CHECK (command IN ('play', 'pause', 'next', 'previous', 'seek', 'volume')),
ADD COLUMN IF NOT EXISTS position_ms INTEGER CHECK (position_ms >= 0),
ADD COLUMN IF NOT EXISTS volume INTEGER CHECK (volume >= 0 AND volume <= 100),
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requested_by_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- 2. Update existing data to migrate from 'action' to 'command'
UPDATE public.playback_commands 
SET command = action 
WHERE command IS NULL AND action IS NOT NULL;

-- 3. Set default values for new columns
UPDATE public.playback_commands 
SET requested_at = created_at 
WHERE requested_at IS NULL;

-- 4. Make command column NOT NULL after migration
ALTER TABLE public.playback_commands 
ALTER COLUMN command SET NOT NULL;

-- 5. Add foreign key constraint for room_id to reference room table
-- First check if room_id column is UUID or TEXT
DO $$
BEGIN
    -- If room_id is TEXT, we need to convert it to UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playback_commands' 
        AND column_name = 'room_id' 
        AND data_type = 'text'
    ) THEN
        -- Convert TEXT room_id to UUID
        ALTER TABLE public.playback_commands 
        ALTER COLUMN room_id TYPE UUID USING room_id::UUID;
        
        RAISE NOTICE 'Converted room_id from TEXT to UUID';
    END IF;
END $$;

-- 6. Add foreign key constraint for room_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_playback_commands_room_id'
    ) THEN
        ALTER TABLE public.playback_commands 
        ADD CONSTRAINT fk_playback_commands_room_id 
        FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playback_commands_command ON public.playback_commands(command);
CREATE INDEX IF NOT EXISTS idx_playback_commands_requested_by ON public.playback_commands(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_playback_commands_requested_at ON public.playback_commands(requested_at);

-- 8. Add unique constraint for room and time (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'idx_playback_commands_room_time'
    ) THEN
        ALTER TABLE public.playback_commands 
        ADD CONSTRAINT idx_playback_commands_room_time 
        UNIQUE (room_id, created_at);
    END IF;
END $$;

-- 9. Enable Row Level Security
ALTER TABLE public.playback_commands ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies
DROP POLICY IF EXISTS "Users can view playback commands from their rooms" ON public.playback_commands;
CREATE POLICY "Users can view playback commands from their rooms" ON public.playback_commands
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert playback commands in their rooms" ON public.playback_commands;
CREATE POLICY "Users can insert playback commands in their rooms" ON public.playback_commands
  FOR INSERT WITH CHECK (
    room_id IN (
      SELECT room_id FROM room 
      WHERE user_1 = auth.uid() OR user_2 = auth.uid()
    ) AND requested_by_user_id = auth.uid()
  );

-- 11. Create cleanup function and trigger
CREATE OR REPLACE FUNCTION cleanup_old_playback_commands()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete commands older than the 100th most recent command for this room
  DELETE FROM public.playback_commands 
  WHERE room_id = NEW.room_id 
    AND created_at < (
      SELECT created_at 
      FROM public.playback_commands 
      WHERE room_id = NEW.room_id 
      ORDER BY created_at DESC 
      LIMIT 1 OFFSET 99
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_old_playback_commands ON public.playback_commands;
CREATE TRIGGER trigger_cleanup_old_playback_commands
  AFTER INSERT ON public.playback_commands
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_playback_commands();

-- 13. Grant permissions
GRANT SELECT, INSERT ON public.playback_commands TO authenticated;

-- 14. Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'playback_commands' 
ORDER BY ordinal_position;

-- 15. Show sample data (if any exists)
SELECT COUNT(*) as total_commands FROM public.playback_commands; 