import React from 'react';
import { Stack } from 'expo-router';
import { MenuProvider } from 'react-native-popup-menu';

export default function ChatLayout() {
  return (
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
  );
}
