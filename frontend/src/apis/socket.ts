import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

const HOST = process.env.EXPO_PUBLIC_API_HOST!;
const PORT = process.env.EXPO_PUBLIC_API_PORT!;
const PUBLIC_URL = process.env.EXPO_PUBLIC_API_PUBLIC_URL!;

if (!HOST || !PORT || !PUBLIC_URL) {
  throw new Error(
    'Define EXPO_PUBLIC_API_HOST, EXPO_PUBLIC_API_PORT & EXPO_PUBLIC_API_PUBLIC_URL in .env',
  );
}

const LOCAL_URL = `http://${HOST}:${PORT}`;

// Use the same logic as your API client
const SOCKET_URL = Platform.OS === 'web' ? LOCAL_URL : PUBLIC_URL;

class SocketManager {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.userId = userId;

    this.socket = io(SOCKET_URL, {
      auth: {
        userId: userId,
      },
      transports: ['websocket', 'polling'], // Match server config
      timeout: 60000, // Match server pingTimeout
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  joinChat(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-chat', roomId);
      console.log(`Joining chat room: ${roomId}`);
    } else {
      console.error('Socket not connected');
    }
  }

  leaveChat(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-chat', roomId);
      console.log(`Leaving chat room: ${roomId}`);
    }
  }

  sendMessage(messageData: {
    room_id: string;
    content?: string;
    sender_id: string;
    media_paths?: string[];
  }) {
    if (this.socket?.connected) {
      this.socket.emit('send-message', messageData);
    } else {
      console.error('Socket not connected');
    }
  }

  editMessage(messageId: string, newInput: string, roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('edit-message', { message_id: messageId, newInput, room_id: roomId });
    } else {
      console.error('Socket not connected');
    }
  }

  deleteMessage(messageId: string, roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('delete-message', { message_id: messageId, room_id: roomId });
    } else {
      console.error('Socket not connected');
    }
  }

  startTyping(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing-start', roomId);
    }
  }

  stopTyping(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing-stop', roomId);
    }
  }

  // Event listeners
  onMessageReceived(callback: (message: any) => void) {
    this.socket?.on('receive-message', callback);
  }

  onMessageEdited(callback: (message: any) => void) {
    this.socket?.on('message-edited', callback);
  }

  onMessageDeleted(callback: (data: { message_id: string }) => void) {
    this.socket?.on('message-deleted', callback);
  }

  onUserJoined(callback: (data: any) => void) {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (data: any) => void) {
    this.socket?.on('user-left', callback);
  }

  onUserTyping(callback: (data: any) => void) {
    this.socket?.on('user-typing', callback);
  }

  onError(callback: (error: any) => void) {
    this.socket?.on('error', callback);
  }

  // Remove event listeners
  off(event: string) {
    this.socket?.off(event);
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export a singleton instance
export const socketManager = new SocketManager();
export default socketManager;
