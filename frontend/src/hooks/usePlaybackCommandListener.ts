import { useEffect, useRef } from 'react';
import supabase from '@/utils/supabase';
import { spotifyPlayback } from '@/services/SpotifyPlaybackService';
import { updatePlaybackState } from '@/services/playbackState';

export function usePlaybackCommandListener(roomId: string, isController: boolean = false) {
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
    if (!roomId || !isController) return;

    throttledLog('🎵 [Remote Control] Setting up command listener for room:', roomId);

    const channel = supabase
      .channel('playback_commands')
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
            if (action === 'play') {
              await spotifyPlayback.togglePlayPause();
              // Update the shared state after executing
              const currentState = await spotifyPlayback.getPlaybackState();
              if (currentState?.currentTrack?.uri) {
                await updatePlaybackState(roomId, true, currentState.currentTrack.uri);
              }
            }
            if (action === 'pause') {
              await spotifyPlayback.togglePlayPause();
              // Update the shared state after executing
              const currentState = await spotifyPlayback.getPlaybackState();
              if (currentState?.currentTrack?.uri) {
                await updatePlaybackState(roomId, false, currentState.currentTrack.uri);
              }
            }
            if (action === 'play_track' && track_uri) {
              await spotifyPlayback.playTrack(track_uri);
              await updatePlaybackState(roomId, true, track_uri);
            }
            if (action === 'next') {
              await spotifyPlayback.skipToNext();
              // Update state after skipping
              const currentState = await spotifyPlayback.getPlaybackState();
              if (currentState?.currentTrack?.uri) {
                await updatePlaybackState(
                  roomId,
                  currentState.isPlaying,
                  currentState.currentTrack.uri,
                );
              }
            }
            if (action === 'previous') {
              await spotifyPlayback.skipToPrevious();
              // Update state after skipping
              const currentState = await spotifyPlayback.getPlaybackState();
              if (currentState?.currentTrack?.uri) {
                await updatePlaybackState(
                  roomId,
                  currentState.isPlaying,
                  currentState.currentTrack.uri,
                );
              }
            }
          } catch (error) {
            console.error('❌ [Remote Control] Error executing command:', error);
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
