-- Minimal update to existing playback_commands table
-- Just add the essential columns for mirror action

-- Add only the essential new columns
ALTER TABLE public.playback_commands 
ADD COLUMN IF NOT EXISTS command TEXT,
ADD COLUMN IF NOT EXISTS position_ms INTEGER,
ADD COLUMN IF NOT EXISTS volume INTEGER,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requested_by_user_id TEXT;

-- Copy existing action data to command column
UPDATE public.playback_commands 
SET command = action 
WHERE command IS NULL AND action IS NOT NULL;

-- Set default timestamp for existing records
UPDATE public.playback_commands 
SET requested_at = created_at 
WHERE requested_at IS NULL;

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_playback_commands_command ON public.playback_commands(command);
CREATE INDEX IF NOT EXISTS idx_playback_commands_requested_by ON public.playback_commands(requested_by_user_id);

-- Show the final table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playback_commands' 
ORDER BY ordinal_position; 