import { useEffect, useRef } from 'react';
import supabase from '@/utils/supabase';
import { spotifyPlayback } from '@/services/SpotifyPlaybackService';
import { getRoomPlaybackState, updateRoomPlaybackState } from '@/apis/playback';
import { useApiClient } from '@/hooks/useApiClient';

export function usePlaybackCommandListener(roomId: string, isController: boolean = false) {
  const lastLogTime = useRef<number>(0);
  const hasTransferredPlayback = useRef<boolean>(false);
  const apiClient = useApiClient();

  // Throttle logging to every 5 seconds
  const throttledLog = (message: string, data?: any) => {
    const now = Date.now();
    if (now - lastLogTime.current > 5000) {
      // 5 seconds
      console.log(message, data);
      lastLogTime.current = now;
    }
  };

  // Transfer playback to an active device when controller is set up
  const ensureActiveDevice = async () => {
    if (!isController || hasTransferredPlayback.current) return;

    try {
      console.log('🎵 [Controller] Ensuring active device for playback...');
      const devices = await spotifyPlayback.getDevices();

      if (devices.length === 0) {
        console.log('🎵 [Controller] No devices found - user needs to open Spotify');
        return;
      }

      // Find an active device or use the first available
      const activeDevice = devices.find((d) => d.is_active) || devices[0];

      if (activeDevice) {
        console.log('🎵 [Controller] Transferring playback to device:', activeDevice.name);
        await spotifyPlayback.transferPlayback(activeDevice.id);
        hasTransferredPlayback.current = true;
        console.log('🎵 [Controller] Playback transferred successfully');
      }
    } catch (error) {
      console.error('🎵 [Controller] Failed to transfer playback:', error);
    }
  };

  useEffect(() => {
    if (!roomId || !isController) return;

    throttledLog('🎵 [Remote Control] Setting up command listener for room:', roomId);

    // Ensure we have an active device for playback
    ensureActiveDevice();

    const channel = supabase
      .channel(`playback_commands_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'playback_commands',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { action, track_uri } = payload.new;
          console.log('🎵 [Remote Control] Received command:', action, track_uri); // Keep this one immediate for debugging

          try {
            // Add delay to prevent rapid command execution
            await new Promise((resolve) => setTimeout(resolve, 500));

            if (action === 'play') {
              // Check if we have a current track to play
              const currentState = await spotifyPlayback.getPlaybackState();

              if (currentState?.currentTrack?.uri) {
                // We have a track, just resume playback
                console.log('🎵 [Remote Control] Resuming playback');
                await spotifyPlayback.togglePlayPause();
                await updateRoomPlaybackState(
                  roomId,
                  {
                    is_playing: true,
                    current_track_uri: currentState.currentTrack.uri,
                    progress_ms: currentState.progress || 0,
                  },
                  '',
                  apiClient,
                );
              } else if (track_uri) {
                // No current track but we have a track_uri, start playing that track
                console.log('🎵 [Remote Control] Starting playback of track:', track_uri);
                await spotifyPlayback.playTrack(track_uri);
                await updateRoomPlaybackState(
                  roomId,
                  {
                    is_playing: true,
                    current_track_uri: track_uri,
                    progress_ms: 0,
                  },
                  '',
                  apiClient,
                );
              } else {
                console.log('🎵 [Remote Control] No track available to play');
              }
            }
            if (action === 'pause') {
              // For pause, we can just toggle regardless of current state
              console.log('🎵 [Remote Control] Pausing playback');
              await spotifyPlayback.togglePlayPause();

              // Get the current track URI from the command or try to get from state
              const trackUri =
                track_uri ||
                (await spotifyPlayback
                  .getPlaybackState()
                  .then((state) => state?.currentTrack?.uri));
              if (trackUri) {
                await updateRoomPlaybackState(
                  roomId,
                  {
                    is_playing: false,
                    current_track_uri: trackUri,
                    progress_ms: 0,
                  },
                  '',
                  apiClient,
                );
              }
            }
            if (action === 'play_track' && track_uri) {
              console.log('🎵 [Remote Control] Playing specific track:', track_uri);
              await spotifyPlayback.playTrack(track_uri);
              await updateRoomPlaybackState(
                roomId,
                {
                  is_playing: true,
                  current_track_uri: track_uri,
                  progress_ms: 0,
                },
                '',
                apiClient,
              );
            } else if (action === 'play' && track_uri) {
              // Handle play command with track_uri (fallback for play_track)
              console.log('🎵 [Remote Control] Playing track from play command:', track_uri);
              await spotifyPlayback.playTrack(track_uri);
              await updateRoomPlaybackState(
                roomId,
                {
                  is_playing: true,
                  current_track_uri: track_uri,
                  progress_ms: 0,
                },
                '',
                apiClient,
              );
            }
            if (action === 'next') {
              console.log('🎵 [Remote Control] Skipping to next track');
              await spotifyPlayback.skipToNext();
              // Update state after skipping
              const currentState = await spotifyPlayback.getPlaybackState();
              if (currentState?.currentTrack?.uri) {
                await updateRoomPlaybackState(
                  roomId,
                  {
                    is_playing: currentState.isPlaying,
                    current_track_uri: currentState.currentTrack.uri,
                    progress_ms: currentState.progress || 0,
                  },
                  '',
                  apiClient,
                );
              }
            }
            if (action === 'previous') {
              console.log('🎵 [Remote Control] Skipping to previous track');
              await spotifyPlayback.skipToPrevious();
              // Update state after skipping
              const currentState = await spotifyPlayback.getPlaybackState();
              if (currentState?.currentTrack?.uri) {
                await updateRoomPlaybackState(
                  roomId,
                  {
                    is_playing: currentState.isPlaying,
                    current_track_uri: currentState.currentTrack.uri,
                    progress_ms: currentState.progress || 0,
                  },
                  '',
                  apiClient,
                );
              }
            }
          } catch (error) {
            console.error('❌ [Remote Control] Error executing command:', error);

            // Log more details about the error
            if (error instanceof Error) {
              console.error('❌ [Remote Control] Error details:', {
                message: error.message,
                action,
                track_uri,
                roomId,
                isController,
              });

              // If we get a 404 error, it might mean we need to transfer playback
              if (error.message.includes('404') || error.message.includes('No active device')) {
                console.log(
                  '🎵 [Controller] 404 error detected - attempting to transfer playback...',
                );
                hasTransferredPlayback.current = false; // Reset flag to try again
                await ensureActiveDevice();
              }
            }

            // Don't throw - just log the error to prevent crashes
          }
        },
      )
      .subscribe();

    return () => {
      throttledLog('🎵 [Remote Control] Cleaning up command listener');
      supabase.removeChannel(channel);
    };
  }, [roomId, isController]);
}
