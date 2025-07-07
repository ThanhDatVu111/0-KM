import { Router } from 'express';
import {
  fetchRoom,
  createRoom,
  joinRoom,
  deleteRoom,
  updateRoom,
  fetchRoomByUserId
} from '../controllers/roomController';

const router = Router();

// Define RESTful routes relative to `/rooms`
router.post('/', createRoom);
router.put('/:room_id', joinRoom);
router.delete('/:room_id', deleteRoom);
router.get('/:user_id', fetchRoom);
router.get('/', fetchRoomByUserId);
router.patch('/:room_id', updateRoom);

export default router;
