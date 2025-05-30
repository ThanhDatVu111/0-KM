import React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { fetchUser } from '@/apis/user';
import { fetchRoom } from '@/apis/room';
import { ActivityIndicator, View, Text } from 'react-native';

export function useEntryGuard() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace('/'); // Redirect to home if not signed in
      setLoading(false); // Stop loading
      return;
    }

    (async () => {
      setLoading(true); // Start loading
      let user;
      try {
        // Fetch user data
        user = await fetchUser(userId);
        console.log('Fetched user:', user.username, user.birthdate, user.photo_url);
      } catch (err) {
        setLoading(false); // Stop loading on error
        return; // Stop execution if fetching user fails
      }

      if (!user.username || !user.birthdate || !user.photo_url) {
        // Redirect to onboarding if user data is incomplete
        router.replace({
          pathname: '/(onboard)/onboarding-flow',
          params: { user_id: userId },
        });
        setLoading(false); // Stop loading
        return;
      }

      try {
        // Fetch room data
        const room = await fetchRoom({ user_id: userId });
        console.log('Fetched room:', room);

        if (!room.filled) {
          // Redirect to pairing if the room is incomplete
          router.replace({
            pathname: '/(onboard)/join-room',
            params: { userId },
          });
          setLoading(false); // Stop loading
          return;
        }
      } catch (err) {
        console.error('❌ Error fetching room data:', err);
        setLoading(false); // Stop loading on error
        return; // Stop execution if fetching room fails
      }

      // Redirect to home if everything is complete
      router.replace('/(tabs)/home');
      setLoading(false); // Stop loading
    })();
  }, [isLoaded, isSignedIn, userId]);

  // Render a loading indicator if loading
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-primary">
        <ActivityIndicator size="large" color="#F5829B" />
        <Text className="text-lg text-white mt-4" style={{ fontFamily: 'Poppins-Regular' }}>
          Loading...
        </Text>
      </View>
    );
  }

  return null; // No UI is rendered by the hook itself
}