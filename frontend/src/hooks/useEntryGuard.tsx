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
        console.log('✅ Fetched user:', {
          id: userId,
          username: user.username,
          hasProfile: !!user.birthdate && !!user.photo_url,
        });
      } catch (err) {
        setLoading(false); // Stop loading on error
        return; // Stop execution if fetching user fails
      }

      // Check if user needs to complete onboarding
      if (!user.username || !user.birthdate || !user.photo_url) {
        console.log('⚠️ User needs to complete onboarding');
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
        console.log('✅ Room status:', {
          exists: !!room,
          filled: room?.filled,
          roomId: room?.room_id,
        });

        // If no room exists or room is not filled, redirect to pairing
        if (!room.filled) {
          console.log('⚠️ User needs to complete room pairing');
          router.replace({
            pathname: '/(onboard)/join-room',
            params: { userId },
          });
          setLoading(false); // Stop loading
          return;
        }

        // Everything is complete, go to home
        console.log('✅ User setup complete, going to home');
        router.replace('/(tabs)/home');
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
