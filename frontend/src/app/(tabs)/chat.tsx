import React from 'react';
import { Text, StatusBar, Platform, FlatList, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ChatHeader from '@/components/ChatHeader';
import { messages } from '@/constants';
import { sender } from '@/constants';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';

export default function ChatScreen() {
  const roomId = useLocalSearchParams();
  if (!roomId) {
    // Handle if users try to access unavailable rooms

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
          data={messages}
          renderItem={({ item }) => <ChatBubble message={item} myId={sender.userId} />}
          keyExtractor={(item) => item.user.userId.toString()}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        />

        <ChatInput />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
