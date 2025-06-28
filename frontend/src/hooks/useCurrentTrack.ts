import { useState, useEffect } from 'react';
import { spotifyService } from '@/services/spotifyService';
import { SpotifyPlaybackState } from '@/types/spotify';

export function useCurrentTrack(refetchInterval: number = 15000) {
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCurrentTrack = async () => {
    if (!spotifyService.isAuthenticated()) return;

    setIsLoading(true);
    try {
      const state = await spotifyService.getCurrentPlayback();
      setPlaybackState(state);
    } catch (error) {
      console.error('Failed to fetch current track:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTrack();

    // Set up polling
    const interval = setInterval(fetchCurrentTrack, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval]);

  return {
    playbackState,
    currentTrack: playbackState?.item,
    isPlaying: playbackState?.is_playing || false,
    isLoading,
    refetch: fetchCurrentTrack,
  };
}
