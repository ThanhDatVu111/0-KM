import { Router } from 'express';
import { checkRoom, createRoom, joinRoom, deleteRoom } from '../controllers/roomController';
import { checkPrime } from 'crypto';

const router = Router();

router.post('/createRoom', createRoom);
router.put('/joinRoom', joinRoom);
router.get('/checkRoom', checkRoom);
router.delete('/deleteRoom/:room_id', deleteRoom);

export default router;
