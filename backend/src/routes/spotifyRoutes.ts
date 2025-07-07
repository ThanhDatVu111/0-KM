import { Router } from 'express';
import {
  createRoomSpotifyTrack,
  getRoomSpotifyTrack,
  updateRoomSpotifyTrack,
  deleteRoomSpotifyTrack,
  searchSpotifyTracks,
  playSpotifyTrack,
  pauseSpotifyPlayback,
  skipToNextTrack,
  skipToPreviousTrack,
  setPlaybackVolume,
  getAuthUrl,
  handleAuthCallback,
  refreshToken,
} from '../controllers/spotifyController';

const router = Router();

// OAuth routes
router.get('/auth/url', getAuthUrl);
router.post('/auth/callback', handleAuthCallback);
router.post('/auth/refresh', refreshToken);

// Room-based track routes
router.post('/room', createRoomSpotifyTrack);
router.get('/room/:user_id', getRoomSpotifyTrack);
router.put('/room/:user_id', updateRoomSpotifyTrack);
router.delete('/room/:user_id', deleteRoomSpotifyTrack);

// Search route
router.get('/search', searchSpotifyTracks);

// Playback control routes
router.post('/play', playSpotifyTrack);
router.post('/pause', pauseSpotifyPlayback);
router.post('/next', skipToNextTrack);
router.post('/previous', skipToPreviousTrack);
router.post('/volume', setPlaybackVolume);

export default router;
