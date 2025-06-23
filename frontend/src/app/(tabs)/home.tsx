import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import images from '@/constants/images';
import { SignOutButton } from '@/components/SignOutButton';
import { SpotifyWidget } from '@/components/SpotifyWidget';
import { LinearGradient } from 'expo-linear-gradient';

// WidgetCard component
const WidgetCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <View
    className={`rounded-2xl border border-white/20 bg-white/10 p-4 shadow-md backdrop-blur-lg ${className}`}
  >
    {children}
  </View>
);

const Home = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserRoom();
    }
  }, [userId]);

  const loadUserRoom = async () => {
    try {
      setIsLoading(true);
      const roomData = await fetchRoom({ user_id: userId! });

      if (roomData && roomData.room_id) {
        setRoomId(roomData.room_id);
        setIsHost(true);
      }
    } catch (error) {
      console.error('Failed to load user room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifySync = (state: any) => {
    // Handle Spotify sync data
    console.log('Spotify sync state:', state);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#2A0D45]">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#F7BFF7', '#6536DA']} style={{ flex: 1 }}>
      <View className="flex-1 p-6 pt-20">
        {/* Top Widget Grid */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          {/* Calendar Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48">
            <View className="h-1/3 items-start justify-center rounded-t-lg bg-primary p-2">
              <Text className="font-psemibold text-lg text-white">Friday 14</Text>
            </View>
            <View className="h-2/3 items-center justify-center bg-white/10 p-2">
              <Text className="text-center font-pregular text-sm text-white">
                Movie night in 3 days!
              </Text>
            </View>
          </WidgetCard>

          {/* Time Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48">
            <Text className="mb-2 font-pregular text-sm text-white">Alex's time</Text>
            <View className="flex-1 items-center justify-center">
              <Text className="font-pbold text-5xl text-white">9:30</Text>
            </View>
          </WidgetCard>
        </View>

        {/* Second row */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          {/* Weather Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48">
            <Text className="mb-2 font-pregular text-sm text-white">Alex's weather</Text>
            <View className="flex-1 items-center justify-center">
              <Text className="font-pbold text-5xl text-white">100F</Text>
            </View>
          </WidgetCard>

          {/* Image Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48 p-0">
            <ImageBackground
              source={images.polaroid_picture}
              className="h-2/3 w-full items-end justify-start p-2"
              resizeMode="cover"
            >
              <Text className="font-pbold text-lg text-white">PIXEL</Text>
            </ImageBackground>
            <View className="h-1/3 items-start justify-center bg-white/10 p-2">
              <Text className="font-pregular text-sm text-white">April 14th, 2025</Text>
              <Text className="font-plight text-xs text-white">Sunset view</Text>
            </View>
          </WidgetCard>
        </View>

        {/* Spotify Widget */}
        {roomId ? (
          <SpotifyWidget roomId={roomId} isHost={isHost} onSync={handleSpotifySync} />
        ) : (
          <TouchableOpacity
            className="h-28 mt-4 items-center justify-center rounded-2xl border border-white/20 bg-primary/80 p-4 shadow-md backdrop-blur-lg"
            onPress={() => router.push('/(onboard)/join-room')}
          >
            <Text className="text-center font-pmedium text-lg text-white">
              + Join a room to connect with your Spotify +
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="absolute bottom-5 right-5">
        <SignOutButton />
      </View>
    </LinearGradient>
  );
};

export default Home;
