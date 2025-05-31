import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { sender } from '@/constants/chat';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ChatInputProps {
  sendMessage: (content: string, user: any) => void;
}

const ChatInput = ({ sendMessage }: ChatInputProps) => {
  const [inputText, setInputText] = useState('');

  const onImagePress = () => {};
  const onRecordPress = () => {};

  const handleSendMessage = useCallback(() => {
    if (inputText.trim().length > 0) {
      sendMessage(inputText, sender);
      setInputText('');
    }
  }, [inputText, sendMessage]);

  return (
    <View className="bg-white border-t border-gray-200 px-3 py-2 flex-row items-center">
      <View className="flex-1 flex-row bg-white border border-accent px-4 py-2 mr-2 rounded-full">
        {/* Image Button */}
        <TouchableOpacity onPress={onImagePress} className="mt-0.5">
          <FontAwesome name="camera" size={24} color="#F5829B" />
        </TouchableOpacity>
        {/* Text Input : Messages */}
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          className=" text-base p-1 items-center px-4 font-poppins-light"
          style={{ maxHeight: 100 }}
          placeholderTextColor="#F5829B"
        />
        {/* Voice Button */}
        {!inputText && (
          <TouchableOpacity onPress={onRecordPress} className="mt-2.5 absolute right-4">
            <MaterialIcons name="keyboard-voice" size={24} color="#F5829B" />
          </TouchableOpacity>
        )}
      </View>
      {/* Send Button */}
      <TouchableOpacity
        onPress={handleSendMessage}
        className="w-12 h-12 rounded-full bg-accent justify-center items-center"
      >
        <Ionicons name="send" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default ChatInput;
