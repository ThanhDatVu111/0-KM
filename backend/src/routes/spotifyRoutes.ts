import { Router } from 'express';
import {
  createRoomTrack,
  getRoomTrack,
  updateRoomTrack,
  deleteRoomTrack,
  deleteRoomTrackByRoomId,
  searchTracks,
  playTrack,
  pausePlayback,
  skipToNext,
  skipToPrevious,
  setVolume,
  getAuthUrl,
  exchangeCodeForToken,
} from '../controllers/spotifyController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// OAuth routes (no authentication required)
router.get('/auth/url', getAuthUrl);
router.post('/auth/callback', exchangeCodeForToken);

// Room-based track routes (require authentication)
router.post('/room', authMiddleware, createRoomTrack);
router.get('/room/:user_id', authMiddleware, getRoomTrack);
router.put('/room/:user_id', authMiddleware, updateRoomTrack);
router.delete('/room/:user_id', authMiddleware, deleteRoomTrack);
router.delete('/room/delete/:room_id', authMiddleware, deleteRoomTrackByRoomId);

// Search route (no authentication required)
router.get('/search', searchTracks);

// Playback control routes (require authentication)
router.post('/play', authMiddleware, playTrack);
router.post('/pause', authMiddleware, pausePlayback);
router.post('/next', authMiddleware, skipToNext);
router.post('/previous', authMiddleware, skipToPrevious);
router.post('/volume', authMiddleware, setVolume);

export default router;
