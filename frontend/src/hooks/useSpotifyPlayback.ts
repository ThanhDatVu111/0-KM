import { useState, useEffect, useCallback } from 'react';
import supabase from '../utils/supabase';
import { spotifyService, SpotifyPlaybackState } from '../services/spotifyService';

export function useSpotifyPlayback() {
  const [isConnected, setIsConnected] = useState(false);
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Spotify is connected via Supabase
  const checkConnection = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsConnected(false);
        return false;
      }

      // Check for Spotify provider tokens (Supabase v2)
      const spotifyProvider = session.user.app_metadata?.providers?.spotify;
      if (spotifyProvider?.access_token) {
        setIsConnected(true);
        return true;
      }

      // Fallback: legacy metadata tokens
      const spotifyAccessToken = session.user.user_metadata?.spotify_access_token;
      const spotifyExpiry = session.user.user_metadata?.spotify_token_expiry;

      if (spotifyAccessToken && spotifyExpiry && Date.now() < spotifyExpiry) {
        setIsConnected(true);
        return true;
      }

      setIsConnected(false);
      return false;
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

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
    const initConnection = async () => {
      const connected = await checkConnection();
      if (connected) {
        fetchPlaybackState();
      }
    };

    initConnection();
  }, [checkConnection, fetchPlaybackState]);

  // Poll for playback state updates when connected
  useEffect(() => {
    if (!isConnected) {
      setPlaybackState(null);
      setError(null);
      return;
    }

    // Poll for playback state updates every 10 seconds
    const interval = setInterval(fetchPlaybackState, 10000);

    return () => clearInterval(interval);
  }, [fetchPlaybackState, isConnected]);

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
