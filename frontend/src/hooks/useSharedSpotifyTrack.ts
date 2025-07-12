import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useApiClient } from './useApiClient';
import {
  getRoomSpotifyTrack,
  createRoomSpotifyTrack,
  deleteRoomSpotifyTrackByRoomId,
} from '../apis/spotify';
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
  const apiClient = useApiClient();
  const [track, setTrack] = useState<SharedSpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Fetch initial track data using backend API
  const fetchTrack = useCallback(async () => {
    if (!roomId || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      logger.spotify.debug('Fetching shared track for room:', roomId);

      // Use backend API to get the track
      const data = await getRoomSpotifyTrack(userId, apiClient);

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
      } else {
        setTrack(null);
      }
    } catch (err) {
      setError('Failed to load track');
      setTrack(null); // Ensure track is null on error
    } finally {
      setIsLoading(false);
    }
  }, [roomId, userId, apiClient]);

  // Update track state using backend API
  const updateTrack = async (updates: Partial<SharedSpotifyTrack>) => {
    if (!roomId || !userId) return;

    try {
      logger.spotify.debug('Updating shared track:', updates);

      // If we're clearing the track, we're done
      if (!updates.track_uri) {
        setTrack(null);
        return;
      }

      // Use backend API to create the track
      const result = await createRoomSpotifyTrack(
        {
          user_id: userId,
          track_id: updates.track_uri.split(':').pop() || '', // Extract track ID from URI
          track_name: updates.track_name || '',
          artist_name: updates.artist_name || '',
          album_name: updates.album_name || '',
          album_art_url: updates.album_art_url || '',
          duration_ms: updates.duration_ms || 0,
          track_uri: updates.track_uri,
        },
        apiClient,
      );

      if (result) {
        const newTrack: SharedSpotifyTrack = {
          track_uri: result.track_uri,
          track_name: result.track_name,
          artist_name: result.artist_name,
          album_name: result.album_name,
          album_art_url: result.album_art_url,
          duration_ms: result.duration_ms,
          is_playing: updates.is_playing ?? false,
          controlled_by_user_id: userId,
        };

        setTrack(newTrack);
        logger.spotify.debug('Track updated successfully:', newTrack);
      }
    } catch (err) {
      setError('Failed to update track');
    }
  };

  // Clear track using backend API
  const clearTrack = async () => {
    if (!roomId) return;

    try {
      // Use backend API to delete the track
      await deleteRoomSpotifyTrackByRoomId(roomId, apiClient);

      setTrack(null);
      logger.spotify.debug('Track cleared for room:', roomId);

      // Force a re-render after clearing
      setTimeout(() => {
        setTrack(null);
      }, 100);
    } catch (err) {
      setError('Failed to clear track');
    }
  };

  // Set up real-time subscription (keep this for now, but we'll rely more on manual refetching)
  useEffect(() => {
    if (!roomId) {
      setTrack(null);
      return;
    }

    logger.spotify.debug('Setting up real-time subscription for room:', roomId);

    // Initial fetch with a small delay to prevent race conditions
    setTimeout(() => {
      fetchTrack();
    }, 100);

    // For now, we'll rely on manual refetching instead of real-time subscriptions
    // since the backend API doesn't trigger Supabase real-time events
    // We can add polling or manual refresh triggers as needed

    return () => {
      logger.spotify.debug('Cleaning up subscription for room:', roomId);
      if (subscriptionRef.current) {
        // Clean up any existing subscriptions if we add them back later
        subscriptionRef.current = null;
      }
    };
  }, [roomId, userId, fetchTrack]);

  return {
    track,
    isLoading,
    error,
    updateTrack,
    clearTrack,
    refetch: fetchTrack,
  };
}
