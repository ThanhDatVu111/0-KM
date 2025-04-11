import { Slot, Stack, useRouter } from "expo-router";
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import "./globals.css";

export const tokenCache = {
  async getToken(key: string) {
    return await SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return await SecureStore.setItemAsync(key, value);
  },
};

export default function RootLayout() {
  const router = useRouter();

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
      routerPush={(path) => router.push('/')}
      routerReplace={(path) => router.replace('/')}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Slot />
      </Stack>

    </ClerkProvider>
  );
}
