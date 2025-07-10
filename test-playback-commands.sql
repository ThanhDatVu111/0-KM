-- Test script to verify playback commands work with existing table
-- Run this to test without making any schema changes

-- 1. Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playback_commands' 
ORDER BY ordinal_position;

-- 2. Insert a test command using existing structure
INSERT INTO public.playback_commands (
    room_id, 
    action, 
    track_uri, 
    created_at
) VALUES (
    'test-room-123',
    'play',
    'spotify:track:test123',
    NOW()
);

-- 3. Verify the insert worked
SELECT * FROM public.playback_commands 
WHERE room_id = 'test-room-123' 
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Clean up test data
DELETE FROM public.playback_commands 
WHERE room_id = 'test-room-123';

-- 5. Show final state
SELECT COUNT(*) as total_commands FROM public.playback_commands; 