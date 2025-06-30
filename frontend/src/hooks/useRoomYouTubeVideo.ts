import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { getRoomVideo, RoomYouTubeVideo } from '@/apis/youtube';

export function useRoomYouTubeVideo(refetchInterval: number = 15000) {
  const { userId } = useAuth();
  const [roomVideo, setRoomVideo] = useState<RoomYouTubeVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRoom, setHasRoom] = useState(false);

  const fetchRoomVideo = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const videoData = await getRoomVideo(userId);
      setRoomVideo(videoData);
      setHasRoom(true); // If we can fetch room video, user is in a room
    } catch (error: any) {
      console.error('Failed to fetch room video:', error);
      if (error.status === 400 && error.data?.error === 'User must be in a room to add videos') {
        setHasRoom(false);
        setRoomVideo(null);
      } else {
        // Other errors might still mean user is in a room but no video
        setHasRoom(true);
        setRoomVideo(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRoomVideo();
      const interval = setInterval(fetchRoomVideo, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [userId, refetchInterval]);

  return {
    roomVideo,
    hasRoom,
    isLoading,
    refetchRoomVideo: fetchRoomVideo,
  };
}
