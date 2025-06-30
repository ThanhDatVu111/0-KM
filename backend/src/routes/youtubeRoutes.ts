import express from 'express';
import {
  upsertYouTubeVideo,
  getUserYouTubeVideo,
  getPartnerYouTubeVideo,
  deleteUserYouTubeVideo,
} from '../controllers/youtubeController';

const router = express.Router();

// Test endpoint to check if routes are working
router.get('/test', (_req, res) => {
  res.json({ message: 'YouTube routes are working!' });
});

// Create or update user's YouTube video
router.post('/videos', upsertYouTubeVideo);

// Get user's YouTube video
router.get('/videos/:user_id', getUserYouTubeVideo);

// Get partner's YouTube video
router.get('/partner-video/:user_id', getPartnerYouTubeVideo);

// Delete user's YouTube video
router.delete('/videos/:user_id', deleteUserYouTubeVideo);

export default router;
