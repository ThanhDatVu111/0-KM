import { Router } from 'express';
import { createRoom, joinRoom, deleteRoom } from '../controllers/roomController';

const router = Router();

router.post('/createRoom', createRoom);
router.put('/joinRoom', joinRoom);
router.delete('/deleteRoom/:room_id', deleteRoom);

export default router;
