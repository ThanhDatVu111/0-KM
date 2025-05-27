import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { fetchUser } from '@/apis/user';
import { fetchRoom } from '@/apis/room';

export function useEntryGuard() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace('/'); // Redirect to home if not signed in
      return;
    }

    (async () => {
      let user;
      try {
        // Fetch user data
        user = await fetchUser(userId);
        console.log('Fetched user:', user.username, user.birthdate, user.photo_url);
      } catch (err) {
        console.error('❌ Error fetching user data:', err);
        return; // Stop execution if fetching user fails
      }

      if (!user.username || !user.birthdate || !user.photo_url) {
        // Redirect to onboarding if user data is incomplete
        router.replace({
          pathname: '/(onboard)/onboarding-flow',
          params: { user_id: userId },
        });
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
          return;
        }
      } catch (err) {
        console.error('❌ Error fetching room data:', err);
        return; // Stop execution if fetching room fails
      }

      // Redirect to home if everything is complete
      router.replace('/(tabs)/home');
    })();
  }, [isLoaded, isSignedIn, userId]);
}