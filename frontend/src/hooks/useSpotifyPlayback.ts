import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { spotifyService, SpotifyPlaybackState } from '../services/spotifyService';

export function useSpotifyPlayback() {
  const [isConnected, setIsConnected] = useState(false);
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Spotify is connected
  const checkConnection = useCallback(async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('spotify_access_token');
      const refreshToken = await SecureStore.getItemAsync('spotify_refresh_token');
      const tokenExpiry = await SecureStore.getItemAsync('spotify_token_expiry');

      if (accessToken && refreshToken && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        const now = Date.now();

        if (now < expiryTime) {
          setIsConnected(true);
          return true;
        } else {
          // Token expired, try to refresh
          const refreshSuccess = await refreshSpotifyToken(refreshToken);
          setIsConnected(refreshSuccess);
          return refreshSuccess;
        }
      } else {
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  const refreshSpotifyToken = async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' + btoa('f805d2782059483e801da7782a7e04c8:06b28132afaf4c0b9c1f3224c268c35b'),
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const tokenData = await response.json();

      if (tokenData.access_token) {
        // Store the new tokens
        await SecureStore.setItemAsync('spotify_access_token', tokenData.access_token);
        if (tokenData.refresh_token) {
          await SecureStore.setItemAsync('spotify_refresh_token', tokenData.refresh_token);
        }
        await SecureStore.setItemAsync(
          'spotify_token_expiry',
          (Date.now() + (tokenData.expires_in || 3600) * 1000).toString(),
        );

        console.log('✅ Spotify token refreshed successfully');
        return true;
      } else {
        console.error('❌ Failed to refresh Spotify token');
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing Spotify token:', error);
      return false;
    }
  };

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
