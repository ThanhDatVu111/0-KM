import { Router } from 'express';
import { checkRefreshToken, updateRefreshToken } from '../controllers/calendarController';

const router = Router();

router.get('/', checkRefreshToken);
router.put('/', updateRefreshToken);

export default router;
