import { Router } from 'express';
import {
  fetchMessages,
  getMessageById,
  sendMessage,
  deleteMessage,
  editMessage,
} from '../controllers/chatController';
import * as chatService from '../services/chatService';

const router = Router();

// Define RESTful routes relative to /chat
router.get('/', fetchMessages);
router.post('/', sendMessage);
router.get('/:message_id', getMessageById);
router.delete('/:message_id', deleteMessage);
router.put('/:message_id', editMessage);

// POST /messages - Alternative message creation with Socket.IO emission
// router.post('/', async (req, res) => {
//   try {
//     const { message_id, room_id, content, sender_id, created_at, media_paths } = req.body;

//     if (!room_id || (!content && !media_paths)) {
//       res.status(400).json({ error: 'Missing required fields: room_id and content/media_paths' });
//       return;
//     }

//     const message = await chatService.sendMessage({
//       message_id,
//       room_id,
//       content,
//       sender_id,
//       created_at,
//       media_paths,
//     });

//     if (!message) throw new Error('Message creation failed');

//     // Get the io instance from the request
//     const io = req.app.get('io');
//     if (io) {
//       // Emit event to send message data to connected clients
//       io.to(message.room_id).emit('chat message', message);
//     }

//     res.status(201).json({ data: message });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

export default router;
