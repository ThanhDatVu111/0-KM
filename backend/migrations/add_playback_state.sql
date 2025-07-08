-- Add playback_state column to room table
ALTER TABLE room 
ADD COLUMN playback_state JSONB DEFAULT '{"is_playing": false, "current_track_uri": null, "progress_ms": 0, "controlled_by_user_id": null}'::jsonb;

-- Add index for faster queries
CREATE INDEX idx_room_playback_state ON room USING GIN (playback_state);

-- Add comment for documentation
COMMENT ON COLUMN room.playback_state IS 'Stores current playback state: is_playing, current_track_uri, progress_ms, controlled_by_user_id'; 