import { Router } from 'express';
import { checkRefreshToken, updateRefreshToken, fetchRefreshToken } from '../controllers/calendarController';

const router = Router();

router.get('/', checkRefreshToken);
router.put('/', updateRefreshToken);
router.get('/token', fetchRefreshToken)

export default router;
