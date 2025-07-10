import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { spotifyPlayback } from '@/services/SpotifyPlaybackService';
import supabase from '@/utils/supabase';
import { logger } from '@/utils/logger';

interface PlaybackCommand {
  command: 'play' | 'pause' | 'next' | 'previous' | 'seek' | 'volume';
  track_uri?: string;
  position_ms?: number;
  volume?: number;
  requested_at: string;
  requested_by_user_id?: string;
}

export function usePlaybackCommandListener(roomId: string, isController: boolean) {
  const { userId } = useAuth();
  const lastCommandTime = useRef<number>(0);
  const isExecuting = useRef<boolean>(false);

  // Debounce function to prevent rapid command execution
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Execute playback command with error handling and rate limiting
  const executeCommand = useCallback(
    async (command: PlaybackCommand) => {
      if (!isController || isExecuting.current) {
        logger.spotify.debug('Skipping command execution - not controller or already executing');
        return;
      }

      // Rate limiting: minimum 100ms between commands
      const now = Date.now();
      if (now - lastCommandTime.current < 100) {
        logger.spotify.debug('Rate limiting command execution');
        return;
      }

      isExecuting.current = true;
      lastCommandTime.current = now;

      try {
        logger.spotify.info('Executing playback command:', command);

        switch (command.command) {
          case 'play':
            if (command.track_uri) {
              // Calculate network lag offset for timestamp-aware seeking
              const networkLag = Date.now() - new Date(command.requested_at).getTime();
              const adjustedPosition = (command.position_ms || 0) + Math.max(0, networkLag);

              await spotifyPlayback.playTrack(command.track_uri);
              if (adjustedPosition > 0) {
                await spotifyPlayback.seekToPosition(adjustedPosition);
              }
            } else {
              await spotifyPlayback.togglePlayPause();
            }
            break;

          case 'pause':
            await spotifyPlayback.togglePlayPause();
            break;

          case 'next':
            await spotifyPlayback.skipToNext();
            break;

          case 'previous':
            await spotifyPlayback.skipToPrevious();
            break;

          case 'seek':
            if (command.position_ms !== undefined) {
              await spotifyPlayback.seekToPosition(command.position_ms);
            }
            break;

          case 'volume':
            if (command.volume !== undefined) {
              await spotifyPlayback.setVolume(command.volume);
            }
            break;

          default:
            logger.spotify.warn('Unknown command:', command.command);
        }
      } catch (error: any) {
        logger.spotify.error('Error executing playback command:', error);

        // Handle specific Spotify API errors
        if (error.message?.includes('429')) {
          // Rate limited - wait and retry
          const retryAfter = 5000; // Default 5 seconds
          logger.spotify.info(`Rate limited, retrying after ${retryAfter}ms`);
          setTimeout(() => {
            isExecuting.current = false;
          }, retryAfter);
          return;
        }

        if (error.message?.includes('401')) {
          // Token expired - this will be handled by the SpotifyPlaybackService
          logger.spotify.info('Token expired, service will handle refresh');
        }
      } finally {
        isExecuting.current = false;
      }
    },
    [isController],
  );

  // Debounced command execution
  const debouncedExecuteCommand = useCallback(debounce(executeCommand, 50), [
    executeCommand,
    debounce,
  ]);

  // Set up real-time subscription to playback commands
  useEffect(() => {
    if (!roomId || !isController) {
      logger.spotify.debug('Not setting up command listener - no room or not controller');
      return;
    }

    logger.spotify.info('Setting up playback command listener for room:', roomId);

    // Subscribe to real-time updates on playback commands
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
        (payload) => {
          const command = payload.new as PlaybackCommand;
          logger.spotify.debug('Received playback command:', command);

          // Only execute commands from other users (or anonymous commands)
          if (!command.requested_by_user_id || command.requested_by_user_id !== userId) {
            debouncedExecuteCommand(command);
          }
        },
      )
      .subscribe((status) => {
        logger.spotify.debug('Playback command subscription status:', status);
        if (status === 'SUBSCRIBED') {
          logger.spotify.info('Successfully subscribed to playback commands for room:', roomId);
        }
      });

    return () => {
      logger.spotify.debug('Cleaning up playback command listener for room:', roomId);
      supabase.removeChannel(channel);
    };
  }, [roomId, isController, userId, debouncedExecuteCommand]);

  return {
    isController,
  };
}
