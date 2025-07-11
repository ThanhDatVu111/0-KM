import React from 'react';
import { Stack } from 'expo-router';
import { SocketProvider } from '@/utils/SocketProvider';

export default function ChatLayout() {
  return (
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
  );
}
