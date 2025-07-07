import express from 'express';
import {
  createRoomSpotifyTrack,
  getRoomSpotifyTrack,
  updateRoomSpotifyTrack,
  deleteRoomSpotifyTrack,
  searchSpotifyTracksController,
  playSpotifyTrackController,
  pauseSpotifyPlaybackController,
  skipToNextTrackController,
  skipToPreviousTrackController,
  setPlaybackVolumeController,
} from '../controllers/spotifyController';

const router = express.Router();

// Room-based track routes (shared experience)
router.post('/room', createRoomSpotifyTrack);
router.get('/room/:user_id', getRoomSpotifyTrack);
router.put('/room/:user_id', updateRoomSpotifyTrack);
router.delete('/room/:user_id', deleteRoomSpotifyTrack);

// Search routes
router.get('/search', searchSpotifyTracksController);

// Playback control routes
router.post('/play', playSpotifyTrackController);
router.post('/pause', pauseSpotifyPlaybackController);
router.post('/next', skipToNextTrackController);
router.post('/previous', skipToPreviousTrackController);
router.post('/volume', setPlaybackVolumeController);

export default router;
