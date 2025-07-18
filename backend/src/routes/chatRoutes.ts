import { Router } from 'express';
import {
  fetchMessages,
  getMessageById,
  sendMessage,
  deleteMessage,
  editMessage,
} from '../controllers/chatController';

const router = Router();

// Define RESTful routes relative to /chat
router.get('/', fetchMessages);
router.post('/', sendMessage);
router.get('/:message_id', getMessageById);
router.delete('/:message_id', deleteMessage);
router.put('/:message_id', editMessage);

export default router;
