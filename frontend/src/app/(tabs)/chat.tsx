import React, { useState } from 'react';
import { Text, StatusBar, Platform, FlatList, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ChatHeader from '@/components/ChatHeader';
import { messages } from '@/constants';
import { sender } from '@/constants';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';
import { useMessages } from '@/hooks/useMessages';

export default function ChatScreen() {
  const { conversation, sendMessage } = useMessages();
  const roomId = useLocalSearchParams();

  if (!roomId) {
    // Handle if users try to access unavailable rooms. For now, we don't want to touch too much on the DB

    // console.log("Room not found")
    // router.push("/(tabs)/home")
    return <Text>Cannot find the room</Text>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ChatHeader />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={conversation}
          renderItem={({ item }) => <ChatBubble message={item} myId={sender.userId} />}
          keyExtractor={(item) => item.user.userId.toString()}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        />

        <ChatInput sendMessage={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
