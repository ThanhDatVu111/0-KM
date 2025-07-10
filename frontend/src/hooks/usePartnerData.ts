import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import { fetchUser } from '@/apis/user';

export interface PartnerData {
  userId: string;
  username: string;
  timezone?: string;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
}

export function usePartnerData() {
  const { userId } = useAuth();
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRoom, setHasRoom] = useState(false);

  const loadPartnerData = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Fetch room data to get partner ID
      const roomData = await fetchRoom({ user_id: userId });

      if (roomData && roomData.filled) {
        setHasRoom(true);

        // Determine partner ID based on current user
        const currentUserIsUser1 = roomData.user_1 === userId;
        const partnerId = currentUserIsUser1 ? roomData.user_2 : roomData.user_1;

        if (partnerId) {
          // Fetch partner's user data
          const partnerUserData = await fetchUser(partnerId);

          setPartnerData({
            userId: partnerId,
            username: partnerUserData.username || 'Partner',
            timezone: partnerUserData.timezone,
            location: partnerUserData.location_latitude && partnerUserData.location_longitude ? {
              latitude: partnerUserData.location_latitude,
              longitude: partnerUserData.location_longitude,
              city: partnerUserData.location_city || 'Unknown City',
              country: partnerUserData.location_country || 'Unknown Country',
            } : undefined,
          });
        }
      } else {
        setHasRoom(false);
        setPartnerData(null);
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
      setHasRoom(false);
      setPartnerData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPartnerData();
  }, [userId]);

  return {
    partnerData,
    hasRoom,
    isLoading,
    refetchPartnerData: loadPartnerData,
  };
}
