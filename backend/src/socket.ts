import { Server, Socket } from 'socket.io';
import * as chatService from './services/chatService';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
  };
}

export default function socketHandler(io: Server) {
  console.log('🔌 Socket Handler initialized');

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`👤 User connected: ${socket.id}`); // Socket ID

    // Get user information from socket auth or query
    const user_socket_id =
      socket.handshake.auth?.userId || (socket.handshake.query?.userId as string); // Use user_id from Clerk auth as userId

    if (user_socket_id) {
      socket.data.userId = user_socket_id;
      console.log(`✅ User ${user_socket_id} authenticated with socket ${socket.id}`);
    } else {
      console.warn(`⚠️ Socket ${socket.id} connected without user authentication`);
    }

    // Join chat room
    socket.on('join-chat', (room_id: string) => {
      if (!room_id) {
        socket.emit('error', { message: 'Room ID is required to join chat' });
        return;
      }

      socket.join(room_id);
      console.log(`🏠 Socket ${socket.id} joined room ${room_id}`);
      console.log(`Backend: User ${user_socket_id} joined room ${room_id}`);

      // Notify others in the room that user joined
      socket.to(room_id).emit('user-joined', {
        userId: user_socket_id,
        roomId: room_id,
        timestamp: new Date().toISOString(),
      });

      // Confirm to the user that they joined successfully
      socket.emit('joined-room', {
        roomId: room_id,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle sending messages
    socket.on('send-message', async (messageData) => {
      try {
        const {
          room_id,
          content,
          sender_id,
          media_paths,
          created_at,
          is_edited,
          is_read,
          is_sent,
          reaction,
        } = messageData;

        // Validation
        if (!room_id) {
          socket.emit('error', { message: 'room_id is required' });
          return;
        }

        if (!content && (!media_paths || media_paths.length === 0)) {
          socket.emit('error', { message: 'Message must have content or media' });
          return;
        }

        if (!sender_id) {
          socket.emit('error', { message: 'sender_id is required' });
          return;
        }

        io.to(room_id).emit('receive-message', messageData);
        console.log(`✅ Message sent successfully in room ${room_id}`);

        // Generate unique message_id
        const message_id = `${Date.now()}-${sender_id}-${Math.random().toString(36).substr(2, 9)}`;

        console.log(`📝 Sending message in room ${room_id} by user ${sender_id}`);

        // Save message to database
        const savedMessage = await chatService.sendMessage({
          message_id,
          room_id,
          content,
          sender_id,
          media_paths,
          created_at: new Date().toISOString(),
          is_sent,
          is_edited,
          is_read,
          reaction,
        });

        // Broadcast message to all users in the room (including sender)
      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error', {
          message: 'Failed to send message',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Handle message editing
    socket.on('edit-message', async (data) => {
      try {
        const { message_id, newInput, room_id } = data;

        if (!message_id || !newInput) {
          socket.emit('error', { message: 'message_id and newInput are required' });
          return;
        }

        if (!room_id) {
          socket.emit('error', { message: 'room_id is required' });
          return;
        }

        console.log(`✏️ Editing message ${message_id} in room ${room_id}`);

        // Update message in database
        const updatedMessage = await chatService.editMessage({ message_id, newInput });

        // Broadcast edited message to all users in the room
        io.to(room_id).emit('message-edited', {
          ...updatedMessage,
          timestamp: new Date().toISOString(),
        });

        console.log(`✅ Message ${message_id} edited successfully`);
      } catch (error) {
        console.error('❌ Error editing message:', error);
        socket.emit('error', {
          message: 'Failed to edit message',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Handle message deletion
    socket.on('delete-message', async (data) => {
      try {
        const { message_id, room_id } = data;

        if (!message_id) {
          socket.emit('error', { message: 'message_id is required' });
          return;
        }

        if (!room_id) {
          socket.emit('error', { message: 'room_id is required' });
          return;
        }

        console.log(`🗑️ Deleting message ${message_id} from room ${room_id}`);

        // Delete message from database
        await chatService.deleteMessage(message_id);

        // Broadcast message deletion to all users in the room
        io.to(room_id).emit('message-deleted', {
          message_id,
          timestamp: new Date().toISOString(),
        });

        console.log(`✅ Message ${message_id} deleted successfully`);
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        socket.emit('error', {
          message: 'Failed to delete message',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (room_id: string) => {
      if (!room_id) {
        socket.emit('error', { message: 'room_id is required for typing indicator' });
        return;
      }

      socket.to(room_id).emit('user-typing', {
        userId: user_socket_id,
        roomId: room_id,
        isTyping: true,
      });
    });

    socket.on('typing-stop', (room_id: string) => {
      if (!room_id) {
        socket.emit('error', { message: 'room_id is required for typing indicator' });
        return;
      }

      socket.to(room_id).emit('user-typing', {
        userId: user_socket_id,
        roomId: room_id,
        isTyping: false,
      });
    });

    // Handle user leaving room
    socket.on('leave-chat', (room_id: string) => {
      if (!room_id) {
        socket.emit('error', { message: 'room_id is required to leave chat' });
        return;
      }

      socket.leave(room_id);
      socket.to(room_id).emit('user-left', {
        userId: user_socket_id,
        roomId: room_id,
        timestamp: new Date().toISOString(),
      });

      console.log(`👋 Socket ${socket.id} left room ${room_id}`);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error(`❌ Connection error for socket ${socket.id}:`, error);
    });

    // Clean up on disconnect
    socket.on('disconnect', (reason) => {
      console.log(`👋 User ${user_socket_id || 'unknown'} disconnected: ${socket.id} (${reason})`);
    });

    // Handle any other errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  // Handle server-level errors
  io.on('error', (error) => {
    console.error('❌ Socket.IO server error:', error);
  });

  console.log('🔌 Socket event handlers registered');
}
