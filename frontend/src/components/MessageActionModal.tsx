import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Message } from '@/types/chat';

interface Props {
  visible: boolean;
  message: Message | null;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export const MessageActionModal = ({ visible, message, onEdit, onDelete, onCancel }: Props) => {
  if (!message) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View className="flex-1 justify-center items-center bg-black/40">
        <View className="bg-white p-4 rounded-xl w-64">
          <Text className="text-center font-semibold text-lg mb-3">Message Options</Text>

          <TouchableOpacity className="py-2" onPress={onEdit}>
            <Text className="text-blue-500 text-center">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity className="py-2" onPress={onDelete}>
            <Text className="text-red-500 text-center">Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity className="py-2" onPress={onCancel}>
            <Text className="text-gray-500 text-center">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
