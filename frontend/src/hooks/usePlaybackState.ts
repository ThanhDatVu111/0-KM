import { useEffect, useState, useRef } from 'react';
import supabase from '@/utils/supabase';
import { getPlaybackState } from '@/services/playbackState';

interface PlaybackState {
  is_playing: boolean;
  current_track_uri: string;
  updated_at: string;
}

export function usePlaybackState(roomId: string) {
  const [state, setState] = useState<PlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastLogTime = useRef<number>(0);

  // Throttle logging to every 5 seconds
  const throttledLog = (message: string, data?: any) => {
    const now = Date.now();
    if (now - lastLogTime.current > 5000) {
      // 5 seconds
      console.log(message, data);
      lastLogTime.current = now;
    }
  };

  useEffect(() => {
    if (!roomId) return;

    throttledLog('🎵 [Playback State] Setting up state listener for room:', roomId);

    // Initial fetch
    const fetchInitialState = async () => {
      try {
        const data = await getPlaybackState(roomId);
        if (data) {
          setState(data);
        }
      } catch (error) {
        throttledLog('🎵 [Playback State] No initial state found for room:', roomId);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialState();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('playback_state')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'playback_state',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          throttledLog('🎵 [Playback State] State updated:', payload.new);
          setState(payload.new as PlaybackState);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'playback_state',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          throttledLog('🎵 [Playback State] New state created:', payload.new);
          setState(payload.new as PlaybackState);
        },
      )
      .subscribe();

    return () => {
      throttledLog('🎵 [Playback State] Cleaning up state listener');
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { state, isLoading };
}
