import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import { fetchUser } from '@/apis/user';
import supabase from '@/utils/supabase';

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
            location:
              partnerUserData.location_latitude && partnerUserData.location_longitude
                ? {
                    latitude: partnerUserData.location_latitude,
                    longitude: partnerUserData.location_longitude,
                    city: partnerUserData.location_city || 'Unknown City',
                    country: partnerUserData.location_country || 'Unknown Country',
                  }
                : undefined,
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

  // Real-time subscription to partner's location updates
  useEffect(() => {
    if (!hasRoom || !partnerData?.userId) return;

    console.log('🔔 Setting up real-time subscription for partner location updates');

    const channel = supabase
      .channel(`partner_location_${partnerData.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `user_id=eq.${partnerData.userId}`,
        },
        (payload) => {
          console.log('🔔 Partner location update received:', payload.new);
          const updatedUser = payload.new;

          // Update partner data with new location
          setPartnerData((prev) =>
            prev
              ? {
                  ...prev,
                  timezone: updatedUser.timezone || prev.timezone,
                  location:
                    updatedUser.location_latitude && updatedUser.location_longitude
                      ? {
                          latitude: updatedUser.location_latitude,
                          longitude: updatedUser.location_longitude,
                          city: updatedUser.location_city || 'Unknown City',
                          country: updatedUser.location_country || 'Unknown Country',
                        }
                      : undefined,
                }
              : null,
          );
        },
      )
      .subscribe((status) => {
        console.log('🔔 Partner location subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to partner location updates');
        }
      });

    return () => {
      console.log('🔔 Cleaning up partner location subscription');
      supabase.removeChannel(channel);
    };
  }, [hasRoom, partnerData?.userId]);

  return {
    partnerData,
    hasRoom,
    isLoading,
    refetchPartnerData: loadPartnerData,
  };
}
