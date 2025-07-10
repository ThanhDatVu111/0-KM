import {
  createPlaybackCommand,
  getRecentPlaybackCommands,
  cleanupOldPlaybackCommands,
  CreatePlaybackCommandInput,
  PlaybackCommand,
} from '../models/playbackCommandModel';
import { logger } from '../utils/logger';

/**
 * Create a new playback command
 */
export async function createPlaybackCommandService(
  input: CreatePlaybackCommandInput,
): Promise<PlaybackCommand | null> {
  try {
    logger.spotify.info('Creating playback command:', {
      room_id: input.room_id,
      command: input.command,
      requested_by_user_id: input.requested_by_user_id || 'anonymous',
    });

    const command = await createPlaybackCommand(input);

    if (command) {
      // Clean up old commands to prevent table bloat
      await cleanupOldPlaybackCommands(input.room_id);

      logger.spotify.info('Playback command created successfully:', command.id);
    }

    return command;
  } catch (error) {
    logger.spotify.error('Error in createPlaybackCommandService:', error);
    throw error;
  }
}

/**
 * Get recent playback commands for a room
 */
export async function getRecentPlaybackCommandsService(
  room_id: string,
  limit: number = 10,
): Promise<PlaybackCommand[]> {
  try {
    logger.spotify.debug('Getting recent playback commands for room:', room_id);

    const commands = await getRecentPlaybackCommands(room_id, limit);

    logger.spotify.debug(`Found ${commands.length} recent commands`);

    return commands;
  } catch (error) {
    logger.spotify.error('Error in getRecentPlaybackCommandsService:', error);
    throw error;
  }
}

/**
 * Validate playback command input
 */
export function validatePlaybackCommand(input: CreatePlaybackCommandInput): string | null {
  if (!input.room_id) {
    return 'room_id is required';
  }

  if (!input.command && !input.action) {
    return 'command or action is required';
  }

  // requested_by_user_id is optional for backward compatibility
  // requested_at is optional for backward compatibility

  // Validate command-specific fields (only if command is provided)
  if (input.command) {
    switch (input.command) {
      case 'play':
        if (!input.track_uri) {
          return 'track_uri is required for play command';
        }
        if (input.position_ms !== undefined && input.position_ms < 0) {
          return 'position_ms must be non-negative';
        }
        break;

      case 'seek':
        if (input.position_ms === undefined || input.position_ms < 0) {
          return 'position_ms is required and must be non-negative for seek command';
        }
        break;

      case 'volume':
        if (input.volume === undefined || input.volume < 0 || input.volume > 100) {
          return 'volume is required and must be between 0 and 100';
        }
        break;

      case 'pause':
      case 'next':
      case 'previous':
        // These commands don't require additional fields
        break;

      default:
        return `Unknown command: ${input.command}`;
    }
  }

  return null;
}
