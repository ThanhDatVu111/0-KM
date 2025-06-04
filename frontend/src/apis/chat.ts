import {
  Message,
  FetchMessages,
  GetMessageById,
  SendMessage,
  EditMessage,
  DeleteMessage,
} from '@/types/chat';

const host = process.env.EXPO_PUBLIC_API_HOST;
const port = process.env.EXPO_PUBLIC_API_PORT;

if (!host || !port) {
  throw new Error('Missing LOCAL_HOST_URL or PORT in your environment');
}

const BASE_URL = `${host}:${port}`;

export const chatApi = {
  fetchMessages: async (room_id: string): Promise<Message[]> => {
    try {
      const response = await fetch(`${BASE_URL}/chat?room_id=${room_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('Error fetching chat:', error);
      throw error;
    }
  },
  getMessageById: async (message_id: string): Promise<Message> => {
    try {
      const response = await fetch(`${BASE_URL}/chat/${message_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('Error fetching message:', {
        error,
        message: error.message,
        message_id,
      });
      throw error;
    }
  },

  sendMessage: async (message: SendMessage): Promise<Message> => {
    try {
      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      return result.data;
    } catch (error: any) {
      console.error('Error sending message:', {
        error,
        message: error.message,
        payload: message,
      });
      throw error;
    }
  },

  editMessage: async (message_id: string, content: string): Promise<Message> => {
    try {
      const response = await fetch(`${BASE_URL}/chat/${message_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newInput: content }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('Error editing message:', {
        error,
        message: error.message,
        message_id,
      });
      throw error;
    }
  },

  deleteMessage: async (message_id: string): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/chat/${message_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error deleting message:', {
        error,
        message: error.message,
        message_id,
      });
      throw error;
    }
  },
};
