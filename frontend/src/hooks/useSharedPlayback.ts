import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useApiClient } from './useApiClient';
import { updateRoomPlaybackState, getRoomPlaybackState, PlaybackState } from '../apis/playback';
import { spotifyPlayback } from '../services/SpotifyPlaybackService';

export function useSharedPlayback(roomId: string | null) {
  const { userId } = useAuth();
  const apiClient = useApiClient();
  const [sharedPlaybackState, setSharedPlaybackState] = useState<PlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch shared playback state
  const fetchSharedPlaybackState = useCallback(async () => {
    if (!roomId) return;

    try {
      setError(null);
      const state = await getRoomPlaybackState(roomId, apiClient);
      setSharedPlaybackState(state);
    } catch (err) {
      console.error('Error fetching shared playback state:', err);
      setError('Failed to get shared playback state');
    }
  }, [roomId, apiClient]);

  // Update shared playback state
  const updateSharedPlaybackState = useCallback(
    async (newState: Partial<PlaybackState>) => {
      if (!roomId || !userId) return;

      try {
        setIsLoading(true);
        setError(null);

        const updatedState: PlaybackState = {
          is_playing: newState.is_playing ?? sharedPlaybackState?.is_playing ?? false,
          current_track_uri: newState.current_track_uri ?? sharedPlaybackState?.current_track_uri,
          progress_ms: newState.progress_ms ?? sharedPlaybackState?.progress_ms ?? 0,
          controlled_by_user_id: userId,
        };

        const result = await updateRoomPlaybackState(roomId, updatedState, userId, apiClient);
        setSharedPlaybackState(result);
      } catch (err) {
        console.error('Error updating shared playback state:', err);
        setError('Failed to update shared playback state');
      } finally {
        setIsLoading(false);
      }
    },
    [roomId, userId, apiClient, sharedPlaybackState],
  );

  // Poll for shared playback state updates
  useEffect(() => {
    if (!roomId) return;

    fetchSharedPlaybackState();

    // Poll every 2 seconds for updates
    const interval = setInterval(fetchSharedPlaybackState, 2000);

    return () => clearInterval(interval);
  }, [fetchSharedPlaybackState, roomId]);

  // Sync with local Spotify playback
  const syncWithSpotify = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      const spotifyState = await spotifyPlayback.getPlaybackState();
      if (spotifyState) {
        await updateSharedPlaybackState({
          is_playing: spotifyState.isPlaying,
          current_track_uri: spotifyState.currentTrack?.uri,
          progress_ms: spotifyState.progress,
        });
      }
    } catch (err) {
      console.error('Error syncing with Spotify:', err);
    }
  }, [roomId, userId, updateSharedPlaybackState]);

  // Control playback through shared state
  const togglePlayPause = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      const newIsPlaying = !sharedPlaybackState?.is_playing;
      await updateSharedPlaybackState({ is_playing: newIsPlaying });

      // Also try to control local Spotify
      try {
        await spotifyPlayback.togglePlayPause();
      } catch (spotifyError) {
        console.log('Local Spotify control failed, but shared state updated');
      }
    } catch (err) {
      console.error('Error toggling play/pause:', err);
    }
  }, [roomId, userId, sharedPlaybackState, updateSharedPlaybackState]);

  const playTrack = useCallback(
    async (trackUri: string) => {
      if (!roomId || !userId) return;

      try {
        await updateSharedPlaybackState({
          is_playing: true,
          current_track_uri: trackUri,
          progress_ms: 0,
        });

        // Also try to play on local Spotify
        try {
          await spotifyPlayback.playTrack(trackUri);
        } catch (spotifyError) {
          console.log('Local Spotify play failed, but shared state updated');
        }
      } catch (err) {
        console.error('Error playing track:', err);
      }
    },
    [roomId, userId, updateSharedPlaybackState],
  );

  const skipToNext = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      // Try to skip on local Spotify first
      try {
        await spotifyPlayback.skipToNext();
        // Sync the new state after a brief delay
        setTimeout(syncWithSpotify, 1000);
      } catch (spotifyError) {
        console.log('Local Spotify skip failed');
      }
    } catch (err) {
      console.error('Error skipping to next:', err);
    }
  }, [roomId, userId, syncWithSpotify]);

  const skipToPrevious = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      // Try to skip on local Spotify first
      try {
        await spotifyPlayback.skipToPrevious();
        // Sync the new state after a brief delay
        setTimeout(syncWithSpotify, 1000);
      } catch (spotifyError) {
        console.log('Local Spotify skip failed');
      }
    } catch (err) {
      console.error('Error skipping to previous:', err);
    }
  }, [roomId, userId, syncWithSpotify]);

  return {
    sharedPlaybackState,
    isLoading,
    error,
    togglePlayPause,
    playTrack,
    skipToNext,
    skipToPrevious,
    updateSharedPlaybackState,
    syncWithSpotify,
    refresh: fetchSharedPlaybackState,
  };
}
