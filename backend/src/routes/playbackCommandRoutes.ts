import { Router } from 'express';
import {
  createPlaybackCommand,
  getRecentPlaybackCommands,
} from '../controllers/playbackCommandController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Create a new playback command (requires authentication)
router.post('/:room_id/playback-command', authMiddleware, createPlaybackCommand);

// Get recent playback commands for a room
router.get('/:room_id/playback-commands', getRecentPlaybackCommands);

export default router;
