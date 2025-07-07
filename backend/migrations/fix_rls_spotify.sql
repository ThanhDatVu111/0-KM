-- Fix Row Level Security policies for room_spotify_tracks table
-- This allows the service role to bypass RLS while maintaining security for regular users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view room spotify tracks" ON room_spotify_tracks;
DROP POLICY IF EXISTS "Users can insert room spotify tracks" ON room_spotify_tracks;
DROP POLICY IF EXISTS "Users can update room spotify tracks" ON room_spotify_tracks;
DROP POLICY IF EXISTS "Users can delete room spotify tracks" ON room_spotify_tracks;

-- Create new policies that work with both authenticated users and service role
CREATE POLICY "Allow service role full access" ON room_spotify_tracks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view room spotify tracks" ON room_spotify_tracks
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM room 
            WHERE room_id = room_spotify_tracks.room_id 
            AND (user_1 = auth.uid()::text OR user_2 = auth.uid()::text)
            AND filled = true
        )
    );

CREATE POLICY "Users can insert room spotify tracks" ON room_spotify_tracks
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM room 
                WHERE room_id = room_spotify_tracks.room_id 
                AND (user_1 = auth.uid()::text OR user_2 = auth.uid()::text)
                AND filled = true
            )
            AND added_by_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update room spotify tracks" ON room_spotify_tracks
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM room 
            WHERE room_id = room_spotify_tracks.room_id 
            AND (user_1 = auth.uid()::text OR user_2 = auth.uid()::text)
            AND filled = true
        )
    );

CREATE POLICY "Users can delete room spotify tracks" ON room_spotify_tracks
    FOR DELETE USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM room 
            WHERE room_id = room_spotify_tracks.room_id 
            AND (user_1 = auth.uid()::text OR user_2 = auth.uid()::text)
            AND filled = true
        )
    ); 