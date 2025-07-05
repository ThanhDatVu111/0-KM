import React from 'react';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import '@/app/globals.css';
import { useEntryGuard } from '@/hooks/useEntryGuard';
import useFont from '@/hooks/useFont';

function AuthenticatedLayout() {
  // Use the custom hook for authentication and redirection
  useEntryGuard();
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hides the top bar
      }}
    ></Stack>
  );
}

export default function RootLayout() {
  const fontsLoaded = useFont(); // <-- call the hook

  if (!fontsLoaded) return null; // or a loading spinner

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <AuthenticatedLayout />
    </ClerkProvider>
  );
}