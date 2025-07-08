import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useApiClient } from '@/hooks/useApiClient';
import { getRoomPlaybackState, updateRoomPlaybackState } from '@/apis/playback';
import { spotifyPlayback } from '@/services/SpotifyPlaybackService';
import { sendPlaybackCommand, sendPlayTrackCommand } from '@/services/playbackCommands';
import supabase from '@/utils/supabase';

interface PlaybackState {
  is_playing: boolean;
  current_track_uri?: string;
  progress_ms: number;
  controlled_by_user_id?: string;
}

export function useSharedPlayback(roomId: string | null) {
  const { userId } = useAuth();
  const apiClient = useApiClient();
  const [sharedPlaybackState, setSharedPlaybackState] = useState<PlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAutoPlayedTrack, setLastAutoPlayedTrack] = useState<string | null>(null);
  const lastLogTime = useRef<number>(0);

  // Throttle logging to every 5 seconds
  const throttledLog = (message: string, data?: any) => {
    const now = Date.now();
    if (now - lastLogTime.current > 5000) {
      console.log(message, data);
      lastLogTime.current = now;
    }
  };

  // Fetch initial playback state
  const fetchSharedPlaybackState = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      const data = await getRoomPlaybackState(roomId, apiClient);
      if (data) {
        setSharedPlaybackState(data);
        throttledLog('🎵 [Real-time] Initial playback state loaded:', data);
      }
    } catch (error) {
      console.error('Error fetching shared playback state:', error);
    }
  }, [roomId, userId, apiClient]);

  // Update shared playback state
  const updateSharedPlaybackState = useCallback(
    async (updates: Partial<PlaybackState>) => {
      if (!roomId || !userId) return;

      setIsLoading(true);
      try {
        const newState: PlaybackState = {
          is_playing: updates.is_playing ?? sharedPlaybackState?.is_playing ?? false,
          current_track_uri: updates.current_track_uri ?? sharedPlaybackState?.current_track_uri,
          progress_ms: updates.progress_ms ?? sharedPlaybackState?.progress_ms ?? 0,
          // Only include controlled_by_user_id if it's explicitly provided (for track changes)
          // Don't include it for play/pause updates to avoid controller flipping
          ...(updates.controlled_by_user_id && {
            controlled_by_user_id: updates.controlled_by_user_id,
          }),
        };

        await updateRoomPlaybackState(roomId, newState, userId, apiClient);
        throttledLog('🎵 [Real-time] Playback state updated:', newState);
      } catch (error) {
        console.error('Error updating shared playback state:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [roomId, userId, apiClient, sharedPlaybackState],
  );

  // Set up real-time subscription to room playback_state changes
  useEffect(() => {
    if (!roomId) return;

    throttledLog('🎵 [Real-time] Setting up playback state listener for room:', roomId);

    // Initial fetch
    fetchSharedPlaybackState();

    // Subscribe to real-time updates on the room table's playback_state column
    const channel = supabase
      .channel('room_playback_state')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newPlaybackState = payload.new?.playback_state;
          if (newPlaybackState) {
            throttledLog('🎵 [Real-time] Playback state changed:', newPlaybackState);
            setSharedPlaybackState(newPlaybackState);
          }
        },
      )
      .subscribe();

    return () => {
      throttledLog('🎵 [Real-time] Cleaning up playback state listener');
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchSharedPlaybackState]);

  // Auto-play logic: Handle both controller and non-controller play commands
  useEffect(() => {
    if (!roomId || !userId || !sharedPlaybackState) return;

    const isController = sharedPlaybackState.controlled_by_user_id === userId;
    const hasTrackUri = sharedPlaybackState.current_track_uri;
    const isPlaying = sharedPlaybackState.is_playing;

    // Auto-play should trigger when:
    // 1. Non-controller user and controller starts playing (original logic)
    const shouldAutoPlay =
      !isController &&
      hasTrackUri &&
      isPlaying &&
      lastAutoPlayedTrack !== sharedPlaybackState.current_track_uri;

    // Only log auto-play checks when something changes
    if (
      shouldAutoPlay ||
      (hasTrackUri && lastAutoPlayedTrack !== sharedPlaybackState.current_track_uri)
    ) {
      throttledLog('🎵 Auto-play check:', {
        userId,
        isController,
        isPlaying,
        currentTrackUri: hasTrackUri,
        lastAutoPlayedTrack,
        shouldAutoPlay,
        reason: !isController ? 'non-controller' : 'controller-playing',
      });
    }

    if (shouldAutoPlay) {
      console.log(
        '🎵 Auto-playing track:',
        sharedPlaybackState.current_track_uri,
        isController ? '(controller user)' : '(non-controller user)',
      );

      // Mark this track as auto-played
      setLastAutoPlayedTrack(sharedPlaybackState.current_track_uri || null);

      // Try to auto-play, but don't fail if Spotify isn't connected
      if (sharedPlaybackState.current_track_uri) {
        spotifyPlayback.playTrack(sharedPlaybackState.current_track_uri).catch((err) => {
          if (err.message?.includes('No valid Spotify access token')) {
            console.log('🎵 Auto-play skipped - User not connected to Spotify (this is normal)');
          } else {
            console.log('🎵 Auto-play failed:', err.message);
          }
        });
      }
    }

    // Reset auto-played track when track changes
    if (hasTrackUri && lastAutoPlayedTrack !== sharedPlaybackState.current_track_uri) {
      setLastAutoPlayedTrack(null);
    }
  }, [roomId, userId, sharedPlaybackState, lastAutoPlayedTrack]);

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

  // Control playback through command relay system
  const togglePlayPause = useCallback(async () => {
    if (!roomId || !userId) return;

    // Debounce rapid button presses
    if (isLoading) {
      console.log('🎵 Ignoring rapid button press - request in progress');
      return;
    }

    try {
      setIsLoading(true);
      const newIsPlaying = !sharedPlaybackState?.is_playing;
      console.log('🎵 Toggle Play/Pause:', {
        userId,
        isController: sharedPlaybackState?.controlled_by_user_id === userId,
        currentState: sharedPlaybackState?.is_playing,
        newState: newIsPlaying,
      });

      // Always send play/pause command, not play track command
      // Include current track URI for play commands so controller knows what to play
      const trackUri = newIsPlaying ? sharedPlaybackState?.current_track_uri : undefined;
      await sendPlaybackCommand(roomId, newIsPlaying ? 'play' : 'pause', trackUri);
      console.log('🎵 Command sent:', {
        action: newIsPlaying ? 'play' : 'pause',
        currentTrackUri: sharedPlaybackState?.current_track_uri,
        isController: sharedPlaybackState?.controlled_by_user_id === userId,
      });

      // Add a small delay to prevent rapid commands
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Error sending play/pause command:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, userId, sharedPlaybackState, isLoading]);

  const playTrack = useCallback(
    async (trackUri: string) => {
      if (!roomId || !userId) return;

      try {
        console.log('🎵 Sending play track command:', trackUri);
        await sendPlayTrackCommand(roomId, trackUri);
      } catch (err) {
        console.error('Error sending play track command:', err);
      }
    },
    [roomId, userId],
  );

  const skipToNext = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      console.log('🎵 Sending skip to next command');
      await sendPlaybackCommand(roomId, 'next');
    } catch (err) {
      console.error('Error sending skip to next command:', err);
    }
  }, [roomId, userId]);

  const skipToPrevious = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      console.log('🎵 Sending skip to previous command');
      await sendPlaybackCommand(roomId, 'previous');
    } catch (err) {
      console.error('Error sending skip to previous command:', err);
    }
  }, [roomId, userId]);

  return {
    sharedPlaybackState,
    isLoading,
    togglePlayPause,
    playTrack,
    skipToNext,
    skipToPrevious,
    syncWithSpotify,
  };
}
