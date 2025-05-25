import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import '@/app/globals.css';
import { fetchUser } from '@/apis/user';
import { useRouter } from 'expo-router';

function AuthenticatedLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace('/'); // Redirect to home if not signed in
      return;
    }

    (async () => {
      try {
        const user = await fetchUser(userId);
        console.log('Fetched user:', user.username, user.birthdate, user.photo_url);

        if (user.username && user.birthdate && user.photo_url) {
          router.replace('/(tabs)/home'); // Redirect to home if user is fully onboarded
        } else {
          router.replace({
            pathname: '/(onboard)/onboardingFlow',
            params: { user_id: userId }, // Redirect to onboarding if user data is incomplete
          });
        }
      } catch (err) {
        console.error('❌ Error fetching user data:', err);
      }
    })();
  }, [isLoaded, isSignedIn, userId]);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hides the top bar
      }}
    >
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <AuthenticatedLayout />
    </ClerkProvider>
  );
}