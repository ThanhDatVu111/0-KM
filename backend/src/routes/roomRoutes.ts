import { Router } from 'express';
import {
  fetchRoom,
  createRoom,
  joinRoom,
  deleteRoom,
  updateRoom,
  updatePlaybackState,
  getPlaybackState,
} from '../controllers/roomController';

const router = Router();

// Define RESTful routes relative to `/rooms`
router.post('/', createRoom);
router.put('/:room_id', joinRoom);
router.delete('/:room_id', deleteRoom);
router.patch('/:room_id', updateRoom);

// Playback state routes (must come before the generic user_id route)
router.put('/:room_id/playback', updatePlaybackState);
router.get('/:room_id/playback', getPlaybackState);

// User-specific routes (must come last to avoid conflicts)
router.get('/:user_id', fetchRoom);

export default router;
