import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { messages, sender } from '@/constants';
import { Message } from 'types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { v4 as uuidv4 } from 'uuid'; // for messageId generation

const ChatInput = () => {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const onImagePress = () => {};
  const onRecordPress = () => {};

  useEffect(() => {
    setConversation(messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())); // mock messages in /constants/index.ts
  }, []);

  const sendMessage = useCallback(() => {
    if (inputText.trim().length > 0) {
      const newMessage: Message = {
        messageId: Math.floor(Math.random()),
        content: inputText.trim(),
        createdAt: new Date(),
        user: sender,
      };

      setConversation((conversation) => [newMessage, ...conversation]);
      setInputText('');
    }
  }, [inputText]);

  return (
    <View className="bg-white border-t border-gray-200 px-3 py-2 flex-row items-center">
      <View className="flex-1 flex-row bg-white border border-accent px-4 py-2 mr-2 rounded-full">
        // Image Button
        <TouchableOpacity onPress={onImagePress} className="mt-0.5">
          <FontAwesome name="camera" size={24} color="#F5829B" />
          // Text Input : Messages
        </TouchableOpacity>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          className=" text-base p-1 items-center px-4 font-poppins-light"
          style={{ maxHeight: 100 }}
          placeholderTextColor="#F5829B"
        />
        // Voice Button
        {!inputText && (
          <TouchableOpacity onPress={onRecordPress} className="mt-2.5 absolute right-4">
            <MaterialIcons name="keyboard-voice" size={24} color="#F5829B" />
          </TouchableOpacity>
        )}
      </View>
      // Send Button
      <TouchableOpacity
        onPress={sendMessage}
        className="w-12 h-12 rounded-full bg-accent justify-center items-center"
      >
        <Ionicons name="send" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default ChatInput;
