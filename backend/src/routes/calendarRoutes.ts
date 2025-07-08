import { Router } from 'express';
import {
  checkRefreshToken,
  updateRefreshToken,
  fetchRefreshToken,
  createEvent,
  fetchUpcomingEvents,
} from '../controllers/calendarController';

const router = Router();

router.get('/', checkRefreshToken);
router.put('/', updateRefreshToken);
router.get('/token', fetchRefreshToken);
router.post('/', createEvent);
router.get('/events', fetchUpcomingEvents);

export default router;
