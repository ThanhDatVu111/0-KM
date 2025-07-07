import { useState, useEffect, useCallback } from 'react';
import { spotifyPlayback } from '../services/SpotifyPlaybackService';

interface SpotifyPlaybackState {
  isPlaying: boolean;
  currentTrack?: {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    duration: number;
    uri: string;
  };
  progress: number;
  volume: number;
}

export function useSpotifyPlayback() {
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current playback state
  const fetchPlaybackState = useCallback(async () => {
    try {
      setError(null);
      const state = await spotifyPlayback.getPlaybackState();
      setPlaybackState(state);
    } catch (err) {
      console.error('Error fetching playback state:', err);
      setError('Failed to get playback state');
    }
  }, []);

  // Initialize and start polling
  useEffect(() => {
    fetchPlaybackState();

    // Poll for playback state updates every 2 seconds
    const interval = setInterval(fetchPlaybackState, 2000);

    return () => clearInterval(interval);
  }, [fetchPlaybackState]);

  // Play a specific track
  const playTrack = useCallback(
    async (trackUri: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await spotifyPlayback.playTrack(trackUri);
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
      await spotifyPlayback.togglePlayPause();
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
      await spotifyPlayback.skipToNext();
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
      await spotifyPlayback.skipToPrevious();
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
        await spotifyPlayback.setVolume(volume);
        await fetchPlaybackState(); // Refresh state after volume change
      } catch (err) {
        console.error('Error setting volume:', err);
        setError('Failed to set volume');
      }
    },
    [fetchPlaybackState],
  );

  // Seek to position
  const seekToPosition = useCallback(
    async (positionMs: number) => {
      try {
        setError(null);
        await spotifyPlayback.seekToPosition(positionMs);
        await fetchPlaybackState(); // Refresh state after seek
      } catch (err) {
        console.error('Error seeking:', err);
        setError('Failed to seek to position');
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
    seekToPosition,
    refresh: fetchPlaybackState,
  };
}
