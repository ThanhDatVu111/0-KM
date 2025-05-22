import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { fetchUser } from '@/apis/user';
import { useRouter } from 'expo-router';

export default function AuthRoutesLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/signin');
      return;
    }

    (async () => {
      try {
        const user = await fetchUser(userId);
        console.log('Fetched user:', user.username, user.birthdate, user.photo_url);
        if (user.username && user.birthdate && user.photo_url) {
          router.replace('/(tabs)/home');
        } else {
          router.replace({
            pathname: '/(onboard)/onboardingFlow',
            params: { user_id: userId },
          });
        }
      } catch (err) {
        console.error('❌ Error fetching user data:', err);
        return;
      }
    })();
  }, [isLoaded, isSignedIn, userId]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
