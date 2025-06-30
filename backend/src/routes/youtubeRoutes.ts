import express from 'express';
import {
  createRoomYouTubeVideo,
  getRoomYouTubeVideo,
  updateRoomYouTubeVideo,
  deleteRoomYouTubeVideo,
  upsertYouTubeVideo,
  getUserYouTubeVideo,
  getPartnerYouTubeVideo,
} from '../controllers/youtubeController';

const router = express.Router();

// Room-based video routes (new shared experience)
router.post('/room', createRoomYouTubeVideo);
router.get('/room/:user_id', getRoomYouTubeVideo);
router.put('/room/:user_id', updateRoomYouTubeVideo);
router.delete('/room/:user_id', deleteRoomYouTubeVideo);

// Legacy routes for backward compatibility
router.post('/', upsertYouTubeVideo);
router.get('/user/:user_id', getUserYouTubeVideo);
router.get('/partner/:user_id', getPartnerYouTubeVideo);

export default router;
