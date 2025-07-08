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
  const [lastAutoPlayedTrack, setLastAutoPlayedTrack] = useState<string | null>(null);

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

        // Keep the current controller, don't change it unless we're adding a new track
        const currentController = sharedPlaybackState?.controlled_by_user_id;
        const isAddingNewTrack =
          newState.current_track_uri && !sharedPlaybackState?.current_track_uri;

        // Check if this user has Spotify connected
        let hasSpotifyConnected = false;
        try {
          await spotifyPlayback.getPlaybackState();
          hasSpotifyConnected = true;
        } catch (error) {
          hasSpotifyConnected = false;
        }

        // Only change controller if we're adding a new track, there's no current controller, AND this user has Spotify
        const shouldChangeController =
          isAddingNewTrack && !currentController && hasSpotifyConnected;

        const updatedState: PlaybackState = {
          is_playing: newState.is_playing ?? sharedPlaybackState?.is_playing ?? false,
          current_track_uri: newState.current_track_uri ?? sharedPlaybackState?.current_track_uri,
          progress_ms: newState.progress_ms ?? sharedPlaybackState?.progress_ms ?? 0,
          controlled_by_user_id: shouldChangeController ? userId : currentController || userId,
        };

        console.log('🎵 Updating shared state:', {
          userId,
          isController: currentController === userId,
          shouldChangeController,
          currentController,
          hasSpotifyConnected,
          isAddingNewTrack,
          newState: updatedState,
        });

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
          console.log('Local Spotify control failed, but shared state updated');
        }
      } else {
        console.log('🎵 Requesting playback change - waiting for controller to respond');
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
