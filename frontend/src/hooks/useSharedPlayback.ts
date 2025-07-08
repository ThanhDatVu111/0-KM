import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useApiClient } from '@/hooks/useApiClient';
import { getRoomPlaybackState, updateRoomPlaybackState } from '@/apis/playback';
import { spotifyPlayback } from '@/services/SpotifyPlaybackService';
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
        const newState = {
          ...sharedPlaybackState,
          ...updates,
        };

        await updateRoomPlaybackState(roomId, newState, apiClient);
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

  // Auto-play on non-controller devices when controller starts playing
  useEffect(() => {
    if (!roomId || !userId || !sharedPlaybackState) return;

    const isController = sharedPlaybackState.controlled_by_user_id === userId;
    const shouldAutoPlay =
      !isController &&
      sharedPlaybackState.is_playing &&
      sharedPlaybackState.current_track_uri &&
      lastAutoPlayedTrack !== sharedPlaybackState.current_track_uri;

    console.log('🎵 Auto-play check:', {
      userId,
      isController,
      isPlaying: sharedPlaybackState.is_playing,
      currentTrackUri: sharedPlaybackState.current_track_uri,
      lastAutoPlayedTrack,
      shouldAutoPlay,
    });

    if (shouldAutoPlay) {
      console.log(
        '🎵 Auto-playing track on non-controller device:',
        sharedPlaybackState.current_track_uri,
      );

      // Mark this track as auto-played
      setLastAutoPlayedTrack(sharedPlaybackState.current_track_uri);

      // Try to auto-play, but don't fail if Spotify isn't connected
      spotifyPlayback.playTrack(sharedPlaybackState.current_track_uri).catch((err) => {
        if (err.message?.includes('No valid Spotify access token')) {
          console.log('🎵 Auto-play skipped - User not connected to Spotify (this is normal)');
        } else {
          console.log('🎵 Auto-play failed:', err.message);
        }
      });
    }

    // Reset auto-played track when track changes
    if (
      sharedPlaybackState.current_track_uri &&
      lastAutoPlayedTrack !== sharedPlaybackState.current_track_uri
    ) {
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

  // Control playback through shared state
  const togglePlayPause = useCallback(async () => {
    if (!roomId || !userId) return;

    // Debounce rapid button presses
    if (isLoading) {
      console.log('🎵 Ignoring rapid button press - request in progress');
      return;
    }

    try {
      const newIsPlaying = !sharedPlaybackState?.is_playing;
      console.log('🎵 Toggle Play/Pause:', {
        userId,
        isController: sharedPlaybackState?.controlled_by_user_id === userId,
        currentState: sharedPlaybackState?.is_playing,
        newState: newIsPlaying,
      });

      await updateSharedPlaybackState({ is_playing: newIsPlaying });

      // Only try to control local Spotify if this user is the controller
      const isController = sharedPlaybackState?.controlled_by_user_id === userId;
      if (isController) {
        try {
          await spotifyPlayback.togglePlayPause();
          console.log('🎵 Controller executed local Spotify control');
        } catch (spotifyError) {
          if (spotifyError.message?.includes('429')) {
            console.log('🎵 Rate limited - Spotify is processing too many requests. Please wait a moment.');
          } else {
            console.log('Local Spotify control failed, but shared state updated');
          }
        }
      } else {
        console.log('🎵 Requesting playback change - waiting for controller to respond');
      }
    } catch (err) {
      console.error('Error toggling play/pause:', err);
    }
  }, [roomId, userId, sharedPlaybackState, updateSharedPlaybackState, isLoading]);

  const playTrack = useCallback(
    async (trackUri: string) => {
      if (!roomId || !userId) return;

      try {
        await updateSharedPlaybackState({
          is_playing: true,
          current_track_uri: trackUri,
          progress_ms: 0,
        });

        // Only try to play on local Spotify if this user is the controller
        const isController = sharedPlaybackState?.controlled_by_user_id === userId;
        if (isController) {
          try {
            await spotifyPlayback.playTrack(trackUri);
          } catch (spotifyError) {
            console.log('Local Spotify play failed, but shared state updated');
          }
        } else {
          console.log('🎵 Requesting track play - waiting for controller to respond');
        }
      } catch (err) {
        console.error('Error playing track:', err);
      }
    },
    [roomId, userId, sharedPlaybackState, updateSharedPlaybackState],
  );

  const skipToNext = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      // Only try to skip on local Spotify if this user is the controller
      const isController = sharedPlaybackState?.controlled_by_user_id === userId;
      if (isController) {
        try {
          await spotifyPlayback.skipToNext();
          // Sync the new state after a brief delay
          setTimeout(syncWithSpotify, 1000);
        } catch (spotifyError) {
          console.log('Local Spotify skip failed');
        }
      } else {
        console.log('🎵 Requesting skip to next - waiting for controller to respond');
      }
    } catch (err) {
      console.error('Error skipping to next:', err);
    }
  }, [roomId, userId, sharedPlaybackState, syncWithSpotify]);

  const skipToPrevious = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      // Only try to skip on local Spotify if this user is the controller
      const isController = sharedPlaybackState?.controlled_by_user_id === userId;
      if (isController) {
        try {
          await spotifyPlayback.skipToPrevious();
          // Sync the new state after a brief delay
          setTimeout(syncWithSpotify, 1000);
        } catch (spotifyError) {
          console.log('Local Spotify skip failed');
        }
      } else {
        console.log('🎵 Requesting skip to previous - waiting for controller to respond');
      }
    } catch (err) {
      console.error('Error skipping to previous:', err);
    }
  }, [roomId, userId, sharedPlaybackState, syncWithSpotify]);

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
