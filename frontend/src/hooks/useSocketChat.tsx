import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../utils/SocketProvider';
import type { EditMessage, Message, SendMessage } from '@/types/chat';
import { sendMessage, editMessage, deleteMessage, fetchMessages } from '@/apis/chat';

export type ChatSocketProps = {
  room_id: string;
  user_id: string;
};

export const useChatSocket = ({ room_id, user_id }: ChatSocketProps) => {
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({});
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    setIsConnected(socket.connected);
    socket.emit('join-chat', { roomId: room_id });
    socket.emit('user-online', { room_id, user_id });

    socket.on('receive-message', (message: Message) => {
      setMessages((prev) => [message, ...prev]);
    });

    socket.on('message-edited', ({ messageId, newContent }) => {
      console.log('Listened to message-edited');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? { ...msg, content: newContent, is_edited: true } // Only update the content field
            : msg,
        ),
      );
    });

    socket.on('message-deleted', ({ message_id }: { message_id: string }) => {
      setMessages((prev) => prev.filter((msg) => msg.message_id !== message_id));
    });

    socket.on('user-typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setIsTyping((prev) => ({ ...prev, [userId]: isTyping }));
    });

    return () => {
      socket.emit('leave-room', { roomId: room_id });
      socket.off('message-edited');
      socket.off('message-deleted');
      socket.off('user-typing');
    };
  }, [socket, room_id]);

  const handleSendMessage = async (messageData: SendMessage) => {
    if (!messageData.content?.trim() && !messageData.media_paths?.length) return;

    socket?.emit('send-message', messageData);
    console.log('Message sent using socket: ', messageData);
    // try {
    //   const savedMessage = await sendMessage(messageData);
    //   setMessages((prev) => [...prev, savedMessage]);
    // } catch (error) {
    //   console.error('Failed to persist message:', error);
    // }
  };

  const handleEditMessage = async (newMessage: EditMessage) => {
    try {
      console.log('Editing', newMessage.message_id);

      // Fix: Use the correct parameter names from the newMessage object
      //   const updatedMessage = await editMessage({
      //     message_id: newMessage.messageId,
      //     content: newMessage.newContent,
      //   });

      // Fix: Use correct parameter names and include room_id
      socket?.emit('edit-message', {
        message_id: newMessage.message_id, // Server expects message_id, not messageId
        newInput: newMessage.content, // Server expects newInput, not newContent
        room_id: newMessage.room_id,
      });

      //   setMessages((prev) =>
      //     prev.map((msg) =>
      //       msg.message_id === newMessage.message_id
      //         ? { ...msg, content: newMessage.content }
      //         : msg,
      //     ),
      //   );
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      socket?.emit('delete-message', { roomId: room_id, message_id: messageId });
      setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleTyping = (typing: boolean) => {
    socket?.emit('typing', { roomId: room_id, isTyping: typing });
  };

  const handleTypingChange = (text: string) => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    handleTyping(true);
    typingTimeoutRef.current = setTimeout(() => handleTyping(false), 2000);
  };

  const loadMessages = async () => {
    try {
      const fetched = await fetchMessages({ room_id });
      setMessages(fetched);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  return {
    messages,
    isTyping,
    isConnected,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleTyping,
    handleTypingChange,
    loadMessages,
  };
};
