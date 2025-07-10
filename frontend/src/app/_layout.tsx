import React from 'react';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import '@/app/globals.css';
import { useEntryGuard } from '@/hooks/useEntryGuard';
import useFont from '@/hooks/useFont';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '@/utils/SocketProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

function AuthenticatedLayout() {
  // Use the custom hook for authentication and redirection
  useEntryGuard();
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false, // Hides the top bar
        }}
      ></Stack>
    </QueryClientProvider>
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
