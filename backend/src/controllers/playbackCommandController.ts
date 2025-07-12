import { Request, Response, NextFunction } from 'express';
import {
  createPlaybackCommandService,
  getRecentPlaybackCommandsService,
  validatePlaybackCommand,
} from '../services/playbackCommandService';
import { CreatePlaybackCommandInput } from '../models/playbackCommandModel';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * Create a new playback command
 */
export async function createPlaybackCommand(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id } = req.params;
    const { command, track_uri, position_ms, volume, requested_at } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const input: CreatePlaybackCommandInput = {
      room_id,
      command,
      track_uri,
      position_ms,
      volume,
      requested_at,
      requested_by_user_id: userId,
    };

    // Validate input
    const validationError = validatePlaybackCommand(input);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const playbackCommand = await createPlaybackCommandService(input);

    if (!playbackCommand) {
      res.status(500).json({ error: 'Failed to create playback command' });
      return;
    }

    logger.spotify.info('Playback command created:', {
      id: playbackCommand.id,
      room_id: playbackCommand.room_id,
      command: playbackCommand.command,
      requested_by_user_id: playbackCommand.requested_by_user_id || 'anonymous',
    });

    res.status(201).json(playbackCommand);
  } catch (error: any) {
    logger.spotify.error('Error in createPlaybackCommand controller:', error);
    next(error);
  }
}

/**
 * Get recent playback commands for a room
 */
export async function getRecentPlaybackCommands(
  req: Request<{ room_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!room_id) {
      res.status(400).json({ error: 'room_id is required' });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({ error: 'limit must be between 1 and 100' });
      return;
    }

    const commands = await getRecentPlaybackCommandsService(room_id, limit);

    logger.spotify.debug(`Retrieved ${commands.length} playback commands for room:`, room_id);

    res.status(200).json(commands);
  } catch (error: any) {
    logger.spotify.error('Error in getRecentPlaybackCommands controller:', error);
    next(error);
  }
}
