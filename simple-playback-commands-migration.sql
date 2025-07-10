-- Simple migration to update existing playback_commands table
-- Add new columns for mirror action approach

-- Show existing data before migration
SELECT 'Existing action values:' as info;
SELECT DISTINCT action, COUNT(*) as count 
FROM public.playback_commands 
GROUP BY action;

-- Add missing columns
ALTER TABLE public.playback_commands 
ADD COLUMN IF NOT EXISTS command TEXT,
ADD COLUMN IF NOT EXISTS position_ms INTEGER,
ADD COLUMN IF NOT EXISTS volume INTEGER,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requested_by_user_id TEXT;

-- Update existing data to migrate from 'action' to 'command'
UPDATE public.playback_commands 
SET command = action 
WHERE command IS NULL AND action IS NOT NULL;

-- Set default values for new columns
UPDATE public.playback_commands 
SET requested_at = created_at 
WHERE requested_at IS NULL;

-- Check and fix any invalid command values
UPDATE public.playback_commands 
SET command = 'play' 
WHERE command NOT IN ('play', 'pause', 'next', 'previous', 'seek', 'volume') 
   OR command IS NULL;

-- Make command column NOT NULL after migration
ALTER TABLE public.playback_commands 
ALTER COLUMN command SET NOT NULL;

-- Add check constraints (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_command') THEN
        ALTER TABLE public.playback_commands 
        ADD CONSTRAINT check_command 
        CHECK (command IN ('play', 'pause', 'next', 'previous', 'seek', 'volume'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_position_ms') THEN
        ALTER TABLE public.playback_commands 
        ADD CONSTRAINT check_position_ms 
        CHECK (position_ms >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_volume') THEN
        ALTER TABLE public.playback_commands 
        ADD CONSTRAINT check_volume 
        CHECK (volume >= 0 AND volume <= 100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_requested_by_user_id') THEN
        ALTER TABLE public.playback_commands 
        ADD CONSTRAINT fk_requested_by_user_id 
        FOREIGN KEY (requested_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_playback_commands_command ON public.playback_commands(command);
CREATE INDEX IF NOT EXISTS idx_playback_commands_requested_by ON public.playback_commands(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_playback_commands_requested_at ON public.playback_commands(requested_at);

-- Enable RLS
ALTER TABLE public.playback_commands ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Grant permissions
GRANT SELECT, INSERT ON public.playback_commands TO authenticated;

-- Show final structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playback_commands' 
ORDER BY ordinal_position; 