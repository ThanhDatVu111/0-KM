import * as React from 'react';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import '@/app/globals.css';

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <Stack
        screenOptions={{
          headerShown: false, // Hides the top bar
        }}
      />
    </ClerkProvider>
  );
}
