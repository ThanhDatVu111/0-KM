import express from 'express';
import { storeSpotifyToken, getPartnerRecentTrack } from '../controllers/spotifyController';

const router = express.Router();

// Test endpoint to check if routes are working
router.get('/test', (_req, res) => {
  res.json({ message: 'Spotify routes are working!' });
});

// Store user's Spotify token
router.post('/tokens', storeSpotifyToken);

// Get partner's recent track
router.get('/partner-track/:user_id', getPartnerRecentTrack);

export default router;
