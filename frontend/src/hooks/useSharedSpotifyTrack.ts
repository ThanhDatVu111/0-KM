import { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import { useAuth } from '@clerk/clerk-expo';
import { logger } from '../utils/logger';

export interface SharedSpotifyTrack {
  track_uri: string | null;
  track_name: string | null;
  artist_name: string | null;
  album_name: string | null;
  album_art_url: string | null;
  duration_ms: number | null;
  is_playing: boolean;
  controlled_by_user_id: string | null;
}

export function useSharedSpotifyTrack(roomId: string | null) {
  const { userId } = useAuth();
  const [track, setTrack] = useState<SharedSpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial track data
  const fetchTrack = async () => {
    if (!roomId) return;

    setIsLoading(true);
    setError(null);

    try {
      logger.spotify.debug('Fetching shared track for room:', roomId);

      const { data, error } = await supabase
        .from('room_spotify_tracks')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No track found
          setTrack(null);
          return;
        }
        throw error;
      }

      if (data) {
        const sharedTrack: SharedSpotifyTrack = {
          track_uri: data.track_uri,
          track_name: data.track_name,
          artist_name: data.artist_name,
          album_name: data.album_name,
          album_art_url: data.album_art_url,
          duration_ms: data.duration_ms,
          is_playing: false, // We'll get this from playback state
          controlled_by_user_id: data.added_by_user_id,
        };

        setTrack(sharedTrack);
        logger.spotify.debug('Shared track loaded:', sharedTrack);
      }
    } catch (err) {
      console.error('Error fetching shared track:', err);
      setError('Failed to load track');
    } finally {
      setIsLoading(false);
    }
  };

  // Update track state
  const updateTrack = async (updates: Partial<SharedSpotifyTrack>) => {
    if (!roomId || !userId) return;

    try {
      logger.spotify.debug('Updating shared track:', updates);

      // First, delete any existing track for this room
      await supabase.from('room_spotify_tracks').delete().eq('room_id', roomId);

      // If we're clearing the track, we're done
      if (!updates.track_uri) {
        setTrack(null);
        return;
      }

      // Insert new track
      const { data, error } = await supabase
        .from('room_spotify_tracks')
        .insert({
          room_id: roomId,
          track_uri: updates.track_uri,
          track_name: updates.track_name,
          artist_name: updates.artist_name,
          album_name: updates.album_name,
          album_art_url: updates.album_art_url,
          duration_ms: updates.duration_ms,
          added_by_user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newTrack: SharedSpotifyTrack = {
          track_uri: data.track_uri,
          track_name: data.track_name,
          artist_name: data.artist_name,
          album_name: data.album_name,
          album_art_url: data.album_art_url,
          duration_ms: data.duration_ms,
          is_playing: updates.is_playing ?? false,
          controlled_by_user_id: userId,
        };

        setTrack(newTrack);
        logger.spotify.debug('Track updated successfully:', newTrack);
      }
    } catch (err) {
      console.error('Error updating shared track:', err);
      setError('Failed to update track');
    }
  };

  // Clear track
  const clearTrack = async () => {
    if (!roomId) return;

    try {
      await supabase.from('room_spotify_tracks').delete().eq('room_id', roomId);

      setTrack(null);
      logger.spotify.debug('Track cleared for room:', roomId);
    } catch (err) {
      console.error('Error clearing track:', err);
      setError('Failed to clear track');
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!roomId) {
      setTrack(null);
      return;
    }

    logger.spotify.debug('Setting up real-time subscription for room:', roomId);

    // Initial fetch
    fetchTrack();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`room_spotify_tracks_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_spotify_tracks',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          logger.spotify.debug('INSERT event received:', payload);
          const newTrack: SharedSpotifyTrack = {
            track_uri: payload.new.track_uri,
            track_name: payload.new.track_name,
            artist_name: payload.new.artist_name,
            album_name: payload.new.album_name,
            album_art_url: payload.new.album_art_url,
            duration_ms: payload.new.duration_ms,
            is_playing: false,
            controlled_by_user_id: payload.new.added_by_user_id,
          };
          setTrack(newTrack);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_spotify_tracks',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          logger.spotify.debug('UPDATE event received:', payload);
          const updatedTrack: SharedSpotifyTrack = {
            track_uri: payload.new.track_uri,
            track_name: payload.new.track_name,
            artist_name: payload.new.artist_name,
            album_name: payload.new.album_name,
            album_art_url: payload.new.album_art_url,
            duration_ms: payload.new.duration_ms,
            is_playing: false,
            controlled_by_user_id: payload.new.added_by_user_id,
          };
          setTrack(updatedTrack);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_spotify_tracks',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          logger.spotify.debug('DELETE event received');
          setTrack(null);
        },
      )
      .subscribe((status) => {
        logger.spotify.debug('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          logger.spotify.info('Successfully subscribed to room_spotify_tracks for room:', roomId);
        }
      });

    return () => {
      logger.spotify.debug('Cleaning up subscription for room:', roomId);
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  return {
    track,
    isLoading,
    error,
    updateTrack,
    clearTrack,
    refetch: fetchTrack,
  };
}
