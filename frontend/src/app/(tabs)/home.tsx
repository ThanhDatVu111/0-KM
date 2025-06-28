import { View, Text, ImageBackground, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import images from '@/constants/images';
import { SignOutButton } from '@/components/SignOutButton';
import { LinearGradient } from 'expo-linear-gradient';

// WidgetCard component
const WidgetCard = ({
  children,
  className = '',
  noPadding = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) => (
  <View
    className={`border border-black bg-white/10 shadow-md backdrop-blur-lg ${noPadding ? '' : 'p-4'} ${className}`}
    style={{ borderWidth: 1.5, borderRadius: 16 }}
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#2A0D45]">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#F7BFF7', '#6536DA']} style={{ flex: 1 }}>
      {/* Full Screen Decoration Image */}
      <View className="absolute inset-0 opacity-100 z-0">
        <Image
          source={images.decoration}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      <View className="flex-1 p-6 pt-40">
        {/* Top Widget Grid */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          {/* Calendar Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48 overflow-hidden" noPadding>
            <View
              style={{
                backgroundColor: '#6536DA',
                height: 48,
                justifyContent: 'center',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <Text className="font-psemibold text-lg text-white px-3">Friday 14</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-center font-pregular text-sm text-black px-3">
                Movie night in 3 days!
              </Text>
            </View>
          </WidgetCard>

          {/* Time Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48">
            <LinearGradient
              colors={['#6536DA', '#F7BFF7']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 16,
                zIndex: -1,
              }}
            />
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
            <LinearGradient
              colors={['#6536DA', '#F7BFF7']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 16,
                zIndex: -1,
              }}
            />
            <Text className="mb-2 font-pregular text-sm text-white">Alex's weather</Text>
            <View className="flex-1 items-center justify-center">
              <Text className="font-pbold text-5xl text-white">100F</Text>
            </View>
          </WidgetCard>

          {/* Image/Memory Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48 overflow-hidden" noPadding>
            <View style={{ flex: 1, position: 'relative' }}>
              <Image
                source={images.memory}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 16,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  padding: 8,
                }}
              >
                <Text className="font-pregular text-black text-sm">April 14th, 2025</Text>
                <Text className="font-plight text-black text-xs">Sunset view</Text>
              </View>
            </View>
          </WidgetCard>
        </View>

        {/* Join Room Widget */}
        {!roomId && (
          <TouchableOpacity
            className="h-28 mt-4 items-center justify-center rounded-2xl border border-white/20 bg-primary/80 p-4 shadow-md backdrop-blur-lg"
            onPress={() => router.push('/(onboard)/join-room')}
          >
            <Text className="text-center font-pmedium text-lg text-white">
              + Join a room to connect with your partner +
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
