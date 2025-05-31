import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { fetchUser } from '@/apis/user';
import { fetchRoom } from '@/apis/room';
import { Alert } from 'react-native';

export function useEntryGuard() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace('/');
      return;
    }

    (async () => {
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
        console.error('❌ Error fetching user data:', err);
        Alert.alert('Error', 'Failed to load your profile. Please try again later.');
        return;
      }

      // Check if user needs to complete onboarding
      if (!user.username || !user.birthdate || !user.photo_url) {
        console.log('⚠️ User needs to complete onboarding');
        router.replace({
          pathname: '/(onboard)/onboarding-flow',
          params: { user_id: userId },
        });
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
        if (!room || !room.filled) {
          console.log('⚠️ User needs to complete room pairing');
          router.replace({
            pathname: '/(onboard)/join-room',
            params: { userId },
          });
          return;
        }

        // Everything is complete, go to home
        console.log('✅ User setup complete, going to home');
        router.replace('/(tabs)/home');
      } catch (err) {
        console.error('❌ Error fetching room data:', err);
        Alert.alert(
          'Connection Error',
          'Failed to connect to your room. Please check your connection and try again.',
        );
      }
    })();
  }, [isLoaded, isSignedIn, userId]);
}
