import { Router } from 'express';
import {
  createChat,
  fetchMessages,
  getMessageById,
  sendMessage,
  deleteMessage,
  editMessage,
} from '../controllers/chatController';

const router = Router();

// Define RESTful routes relative to /chat
router.post('/', createChat);
router.get(':/room_id', fetchMessages);
router.get(':/message_id', getMessageById);
router.post(':/message_id', sendMessage);
router.delete(':/message_id', deleteMessage);
router.put('/:message_id', editMessage);

export default router;
