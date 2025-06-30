import { useState, useEffect } from 'react';
import { spotifyService } from '@/services/spotifyService';
import { SpotifyTrack } from '@/types/spotify';

export function useCurrentTrack(refetchInterval: number = 15000) {
  const [recentTrack, setRecentTrack] = useState<SpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecentTrack = async () => {
    if (!spotifyService.isAuthenticated()) return;

    setIsLoading(true);
    try {
      const track = await spotifyService.getRecentlyPlayed();
      setRecentTrack(track);
    } catch (error) {
      console.error('Failed to fetch recent track:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentTrack();

    // Set up polling
    const interval = setInterval(fetchRecentTrack, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval]);

  return {
    recentTrack,
    currentTrack: recentTrack, // For backward compatibility
    isPlaying: false, // We can't know if it's currently playing with free accounts
    isLoading,
    refetch: fetchRecentTrack,
  };
}
