import { useState, useEffect, useCallback } from 'react';
import { spotifyService, SpotifyPlaybackState } from '../services/spotifyService';
import { useSpotifyAuth } from './useSpotifyAuth';

export function useSpotifyPlayback() {
  const { status } = useSpotifyAuth();
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current playback state
  const fetchPlaybackState = useCallback(async () => {
    try {
      setError(null);
      const state = await spotifyService.getPlaybackState();
      setPlaybackState(state);
    } catch (err) {
      console.error('Error fetching playback state:', err);
      setError('Failed to get playback state');
    }
  }, []);

  // Initialize and start polling only when connected
  useEffect(() => {
    if (status !== 'connected') {
      setPlaybackState(null);
      setError(null);
      return;
    }

    fetchPlaybackState();

    // Poll for playback state updates every 10 seconds
    const interval = setInterval(fetchPlaybackState, 10000);

    return () => clearInterval(interval);
  }, [fetchPlaybackState, status]);

  // Play a specific track
  const playTrack = useCallback(
    async (trackUri: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await spotifyService.playTrack(trackUri);
        await fetchPlaybackState(); // Refresh state after playing
      } catch (err) {
        console.error('Error playing track:', err);
        setError('Failed to play track');
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPlaybackState],
  );

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await spotifyService.togglePlayPause();
      await fetchPlaybackState(); // Refresh state after toggle
    } catch (err) {
      console.error('Error toggling play/pause:', err);
      setError('Failed to toggle playback');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlaybackState]);

  // Skip to next track
  const skipToNext = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await spotifyService.skipToNext();
      await fetchPlaybackState(); // Refresh state after skip
    } catch (err) {
      console.error('Error skipping to next:', err);
      setError('Failed to skip to next track');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlaybackState]);

  // Skip to previous track
  const skipToPrevious = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await spotifyService.skipToPrevious();
      await fetchPlaybackState(); // Refresh state after skip
    } catch (err) {
      console.error('Error skipping to previous:', err);
      setError('Failed to skip to previous track');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlaybackState]);

  // Set volume
  const setVolume = useCallback(
    async (volume: number) => {
      try {
        setError(null);
        await spotifyService.setVolume(volume);
        await fetchPlaybackState(); // Refresh state after volume change
      } catch (err) {
        console.error('Error setting volume:', err);
        setError('Failed to set volume');
      }
    },
    [fetchPlaybackState],
  );

  return {
    playbackState,
    isLoading,
    error,
    playTrack,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    setVolume,
    refresh: fetchPlaybackState,
  };
}
