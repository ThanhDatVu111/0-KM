import { messages } from '@/constants/chat';
import { useCallback, useEffect, useState } from 'react';
import { Message } from '@/types/conversation';

export const useMessages = () => {
  const [conversation, setConversation] = useState<Message[]>([]);

  // Initialize with mock messages
  useEffect(() => {
    setConversation(messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  }, []);

  const addMessage = useCallback((newMessage: Message) => {
    setConversation((prevConversation) => [newMessage, ...prevConversation]);
  }, []);

  const sendMessage = useCallback(
    (content: string, user: any) => {
      if (content.trim().length > 0) {
        const newMessage: Message = {
          messageId: Date.now(), // Use timestamp for unique ID
          content: content.trim(),
          createdAt: new Date(),
          user,
        };
        addMessage(newMessage);
      }
    },
    [addMessage],
  );

  const deleteMessage = useCallback((messageId: number) => {
    setConversation((prevConversation) =>
      prevConversation.filter((msg) => msg.messageId !== messageId),
    );
  }, []);

  const editMessage = useCallback((messageId: number, newContent: string) => {
    setConversation((prevConversation) =>
      prevConversation.map((msg) =>
        msg.messageId === messageId ? { ...msg, content: newContent } : msg,
      ),
    );
  }, []);

  return {
    conversation,
    sendMessage,
    addMessage,
    deleteMessage,
    editMessage,
  };
};
