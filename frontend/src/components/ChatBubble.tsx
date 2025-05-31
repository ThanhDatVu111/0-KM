import { useUser } from '@clerk/clerk-expo';
import React from 'react';
import { View, Text, Image } from 'react-native';
import { Message } from '@/types/conversation';

interface ChatBubbleProps {
  message: Message;
  myId: string;
}

export default function ChatBubble({ message, myId }: ChatBubbleProps) {
  const isSender = message.user.userId === myId;

  return (
    <View className={`flex-row my-1 mx-4 items-end ${isSender ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isSender ? 'bg-accent' : 'bg-primary'}`}
      >
        <Text
          className={`font-poppins-light text-base ${isSender ? 'text-white' : 'text-gray-900'}`}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}
