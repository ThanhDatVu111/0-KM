import { useEffect, useRef, useState } from 'react';
import socketManager from '@/apis/socket';
import { sendMessage, editMessage, deleteMessage } from '@/apis/chat';
import { Message, Socket } from '@/types/chat';

export const useSocketChat = ({ room_id, user_id }: Socket) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({});
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Connect to socket when component mounts
    const socket = socketManager.connect(user_id);

    setIsConnected(socket.connected);

    // Join the chat room
    socketManager.joinChat(room_id);

    // Set up event listeners
    socketManager.onMessageReceived((message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketManager.onMessageEdited((message: Message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.message_id === message.message_id ? message : msg)),
      );
    });

    socketManager.onMessageDeleted(({ message_id }) => {
      setMessages((prev) => prev.filter((msg) => msg.message_id !== message_id));
    });

    socketManager.onUserTyping(({ userId: typingUserId, isTyping: typing }) => {
      setIsTyping((prev) => ({
        ...prev,
        [typingUserId]: typing,
      }));
    });

    socketManager.onError((error) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      socketManager.leaveChat(room_id);
      socketManager.off('receive-message');
      socketManager.off('message-edited');
      socketManager.off('message-deleted');
      socketManager.off('user-typing');
      socketManager.off('error');
    };
  }, [room_id, user_id]);

  const sendMessage = async (content: string, media_paths?: string[]) => {
    try {
      // For real-time messaging, we can send via socket immediately
      // and also save to database via REST API for persistence

      socketManager.sendMessage({
        room_id: room_id,
        content,
        sender_id: user_id,
        media_paths,
      });

      // Optionally also save via REST API for backup/consistency
      // This ensures the message is persisted even if socket fails
  //     try {
  //       await sendMessage({
  //         message_id: `${Date.now()}-${user_id}`,
  //         room_id: room_id,
  //         content: content,
  //         sender_id: user_id,
  //         media_paths,
  //         created_at: new Date().toISOString(),
  //         is_sent: true,
  //       });
  //     } catch (apiError) {
  //       console.warn('Failed to save message via REST API:', apiError);
  //       // Message was still sent via socket, so it's not a complete failure
  //     }
  //   } catch (error) {
  //     console.error('Failed to send message:', error);
  //     throw error;
  //   }
  // };

  const editMessage = (messageId: string, newContent: string) => {
    socketManager.editMessage(messageId, newContent, room_id);
  };

  const deleteMessage = (messageId: string) => {
    socketManager.deleteMessage(messageId, room_id);
  };

  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      socketManager.startTyping(room_id);
    } else {
      socketManager.stopTyping(room_id);
    }
  };

  const handleTypingChange = (text: string) => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing indicator
    handleTyping(true);

    // Stop typing indicator after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  return {
    messages,
    isTyping,
    isConnected,
    sendMessage,
    editMessage,
    deleteMessage,
    handleTypingChange,
    handleTyping,
  };
};
