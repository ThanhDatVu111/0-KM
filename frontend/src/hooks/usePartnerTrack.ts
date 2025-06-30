import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import { getPartnerRecentTrack } from '@/apis/spotify';
import { SpotifyPlaybackState } from '@/types/spotify';

export function usePartnerTrack(refetchInterval: number = 15000) {
  const { userId } = useAuth();
  const [partnerTrack, setPartnerTrack] = useState<SpotifyPlaybackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [hasRoom, setHasRoom] = useState(false);

  const fetchPartnerTrack = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const trackData = await getPartnerRecentTrack({ user_id: userId });
      setPartnerTrack(trackData);
    } catch (error) {
      console.error('Failed to fetch partner track:', error);
      setPartnerTrack(null);
    } finally {
      setIsLoading(false);
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
    if (hasRoom && userId) {
      fetchPartnerTrack();
      const interval = setInterval(fetchPartnerTrack, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [hasRoom, userId, refetchInterval]);

  return {
    partnerTrack,
    partnerId,
    hasRoom,
    isLoading,
    refetch: fetchPartnerTrack,
  };
}
