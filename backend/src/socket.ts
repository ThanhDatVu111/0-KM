import { Server, Socket } from 'socket.io';
import * as chatService from './services/chatService';
// import { v4 as uuidv4 } from 'uuid';

export default function socketHandler(io: Server) {
  console.log('Socket Handler initialized');

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Store user information in socket
    const user_socket_id = socket.handshake.auth.userId;
    if (user_socket_id) {
      socket.data.userId = user_socket_id;
      console.log(`User ${user_socket_id} connected with socket ${socket.id}`);
    }

    // Join chat room
    socket.on('join-chat', (room_id: string) => {
      socket.join(room_id);
      console.log(`Socket ${socket.id} joined room ${room_id}`);

      // Notify others in the room that user joined
      socket.to(room_id).emit('user-joined', {
        userId: user_socket_id,
        roomId: room_id,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle sending messages
    socket.on('send-message', async (messageData) => {
      try {
        const { room_id, content, sender_id, media_paths } = messageData;

        if (!room_id || (!content && !media_paths)) {
          socket.emit('error', {
            message: 'Missing required fields: room_id and content/media_paths',
          });
          return;
        }

        // Generate message_id for new message
        const message_id = `${Date.now()}-${sender_id}`;

        // Save message to database using existing service
        const savedMessage = await chatService.sendMessage({
          message_id,
          room_id,
          content,
          sender_id,
          media_paths,
          created_at: new Date().toISOString(),
        });

        // Broadcast message to all users in the room
        io.to(room_id).emit('receive-message', {
          ...savedMessage,
          timestamp: new Date().toISOString(),
        });

        console.log(`Message sent in room ${room_id} by user ${sender_id}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message editing
    socket.on('edit-message', async (data) => {
      try {
        const { message_id, newInput, room_id } = data;

        if (!message_id || !newInput) {
          socket.emit('error', { message: 'Missing required fields: message_id and newInput' });
          return;
        }

        // Update message in database using existing service
        const updatedMessage = await chatService.editMessage({ message_id, newInput });

        // Broadcast edited message to all users in the room
        io.to(room_id).emit('message-edited', {
          ...updatedMessage,
          timestamp: new Date().toISOString(),
        });

        console.log(`Message ${message_id} edited in room ${room_id}`);
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('delete-message', async (data) => {
      try {
        const { message_id, room_id } = data;

        if (!message_id) {
          socket.emit('error', { message: 'Missing required field: message_id' });
          return;
        }

        // Delete message from database using existing service
        await chatService.deleteMessage(message_id);

        // Broadcast message deletion to all users in the room
        io.to(room_id).emit('message-deleted', {
          message_id,
          timestamp: new Date().toISOString(),
        });

        console.log(`Message ${message_id} deleted from room ${room_id}`);
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (room_id: string) => {
      socket.to(room_id).emit('user-typing', {
        userId: user_socket_id,
        roomId: room_id,
        isTyping: true,
      });
    });

    socket.on('typing-stop', (room_id: string) => {
      socket.to(room_id).emit('user-typing', {
        userId: user_socket_id,
        roomId: room_id,
        isTyping: false,
      });
    });

    // Handle user leaving room
    socket.on('leave-chat', (room_id: string) => {
      socket.leave(room_id);
      socket.to(room_id).emit('user-left', {
        userId: user_socket_id,
        roomId: room_id,
        timestamp: new Date().toISOString(),
      });
      console.log(`Socket ${socket.id} left room ${room_id}`);
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      console.log(`User ${user_socket_id || 'unknown'} disconnected: ${socket.id}`);
    });
  });
}
