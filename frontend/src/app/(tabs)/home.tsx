import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import images from '@/constants/images';
import { SignOutButton } from '@/components/SignOutButton';

// A placeholder for a generic widget card
const WidgetCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <View
    className={`aspect-square rounded-2xl border border-white/20 bg-white/10 p-4 shadow-md backdrop-blur-lg ${className}`}
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
        // Determine if user is host (user_1 is typically the host)
        // You might need to adjust this logic based on your room structure
        setIsHost(true); // For now, assume the current user is host
      }
    } catch (error) {
      console.error('Failed to load user room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#2A0D45]">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={images.navBarBackground} // Assuming this is the gradient background
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 p-6 pt-20">
        {/* Top Widget Grid */}
        <View className="mb-6 flex-row justify-between space-x-6">
          {/* Calendar Widget */}
          <View className="flex-1">
            <WidgetCard>
              <View className="h-1/3 items-start justify-center rounded-t-lg bg-primary p-2">
                <Text className="font-psemibold text-lg text-white">Friday 14</Text>
              </View>
              <View className="h-2/3 items-center justify-center bg-white p-2">
                <Text className="text-center font-pregular text-sm text-black">
                  Movie night in 3 days!
                </Text>
              </View>
            </WidgetCard>
          </View>

          {/* Time Widget */}
          <View className="flex-1">
            <WidgetCard>
              <Text className="mb-2 font-pregular text-sm text-white">Alex's time</Text>
              <View className="flex-1 items-center justify-center">
                <Text className="font-pbold text-5xl text-white">9:30</Text>
              </View>
            </WidgetCard>
          </View>
        </View>

        <View className="mb-6 flex-row justify-between space-x-6">
          {/* Weather Widget */}
          <View className="flex-1">
            <WidgetCard>
              <Text className="mb-2 font-pregular text-sm text-white">Alex's weather</Text>
              <View className="flex-1 items-center justify-center">
                <Text className="font-pbold text-5xl text-white">100F</Text>
              </View>
            </WidgetCard>
          </View>

          {/* Image Widget */}
          <View className="flex-1">
            <WidgetCard className="p-0">
              <ImageBackground
                source={images.polaroid_picture}
                className="h-2/3 w-full items-end justify-start p-2"
                resizeMode="cover"
              >
                <Text className="font-pbold text-lg text-white">PIXEL</Text>
              </ImageBackground>
              <View className="h-1/3 items-start justify-center bg-white p-2">
                <Text className="font-pregular text-sm text-black">April 14th, 2025</Text>
                <Text className="font-plight text-xs text-black">Sunset view</Text>
              </View>
            </WidgetCard>
          </View>
        </View>

        {/* Spotify Widget */}
        {roomId ? (
          <Text className="text-white">Spotify Widget will go here</Text>
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
        <View className="absolute bottom-5 right-5">
          <SignOutButton />
        </View>
      </View>
    </ImageBackground>
  );
};

export default Home;
