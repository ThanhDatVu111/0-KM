import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { getRoomSpotifyTrack, RoomSpotifyTrack } from '@/apis/spotify';

export function useRoomSpotifyTrack(refetchInterval: number = 15000) {
  const { userId } = useAuth();
  const [roomTrack, setRoomTrack] = useState<RoomSpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRoom, setHasRoom] = useState(false);

  const fetchRoomTrack = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const trackData = await getRoomSpotifyTrack(userId);
      setRoomTrack(trackData);
      setHasRoom(true); // If we can fetch room track, user is in a room
    } catch (error: any) {
      console.error('Failed to fetch room track:', error);
      if (error.status === 400 && error.data?.error === 'User must be in a room to add tracks') {
        setHasRoom(false);
        setRoomTrack(null);
      } else {
        // Other errors might still mean user is in a room but no track
        setHasRoom(true);
        setRoomTrack(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRoomTrack();
      const interval = setInterval(fetchRoomTrack, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [userId, refetchInterval]);

  return {
    roomTrack,
    hasRoom,
    isLoading,
    refetchRoomTrack: fetchRoomTrack,
  };
}
