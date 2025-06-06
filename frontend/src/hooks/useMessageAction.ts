import { useState } from 'react';
import { chatApi } from '@/apis/chat';
import { Message } from '@/types/chat';

export function useMessageActions(
  setPreviousChat: React.Dispatch<React.SetStateAction<Message[]>>,
) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const handleDelete = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      setPreviousChat((prev) => prev.filter((m) => m.message_id !== messageId));
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setSelectedMessage(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedMessage) return;
    try {
      await chatApi.editMessage({
        message_id: selectedMessage.message_id,
        content: editedContent
      });

      setPreviousChat((prev) =>
        prev.map((m) =>
          m.message_id === selectedMessage.message_id ? { ...m, content: editedContent } : m,
        ),
      );
    } catch (err) {
      console.error('Edit failed', err);
    } finally {
      setIsEditing(false);
      setSelectedMessage(null);
    }
  };

  return {
    selectedMessage,
    isEditing,
    editedContent,
    setEditedContent,
    setSelectedMessage,
    setIsEditing,
    handleDelete,
    handleSaveEdit,
  };
}
