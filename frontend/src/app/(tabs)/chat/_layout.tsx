import React from 'react';
import { Stack } from 'expo-router';
import { SocketProvider } from 'utils/SocketProvider';
import { MenuProvider } from 'react-native-popup-menu';

export default function ChatLayout() {
  return (
    <MenuProvider>
      <SocketProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </SocketProvider>
    </MenuProvider>
  );
}
