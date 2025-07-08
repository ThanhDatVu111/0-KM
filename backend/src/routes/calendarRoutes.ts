import { Router } from 'express';
import {
  checkRefreshToken,
  updateRefreshToken,
  fetchRefreshToken,
  createEvent,
} from '../controllers/calendarController';

const router = Router();

router.get('/', checkRefreshToken);
router.put('/', updateRefreshToken);
router.get('/token', fetchRefreshToken);
router.post('/', createEvent);

export default router;
