import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import { getUserYouTubeVideo, getPartnerYouTubeVideo } from '@/apis/youtube';

export interface YouTubeVideo {
  id: string;
  user_id: string;
  video_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export function useYouTubeVideo(refetchInterval: number = 15000) {
  const { userId } = useAuth();
  const [userVideo, setUserVideo] = useState<YouTubeVideo | null>(null);
  const [partnerVideo, setPartnerVideo] = useState<YouTubeVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [hasRoom, setHasRoom] = useState(false);

  const fetchUserVideo = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const videoData = await getUserYouTubeVideo({ user_id: userId });
      setUserVideo(videoData);
    } catch (error) {
      console.error('Failed to fetch user video:', error);
      setUserVideo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPartnerVideo = async () => {
    if (!userId) return;

    try {
      const videoData = await getPartnerYouTubeVideo({ user_id: userId });
      setPartnerVideo(videoData);
    } catch (error) {
      console.error('Failed to fetch partner video:', error);
      setPartnerVideo(null);
    }
  };

  const loadPartnerData = async () => {
    if (!userId) return;

    try {
      const roomData = await fetchRoom({ user_id: userId });
      if (roomData && roomData.filled) {
        setHasRoom(true);
        // Determine partner ID based on current user
        const currentUserIsUser1 = roomData.user_1 === userId;
        const partnerId = currentUserIsUser1 ? roomData.user_2 : roomData.user_1;
        setPartnerId(partnerId);
      } else {
        setHasRoom(false);
        setPartnerId(null);
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
      setHasRoom(false);
      setPartnerId(null);
    }
  };

  useEffect(() => {
    loadPartnerData();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserVideo();
      const interval = setInterval(fetchUserVideo, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [userId, refetchInterval]);

  useEffect(() => {
    if (hasRoom && userId) {
      fetchPartnerVideo();
      const interval = setInterval(fetchPartnerVideo, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [hasRoom, userId, refetchInterval]);

  return {
    userVideo,
    partnerVideo,
    partnerId,
    hasRoom,
    isLoading,
    refetchUserVideo: fetchUserVideo,
    refetchPartnerVideo: fetchPartnerVideo,
  };
}
