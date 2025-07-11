import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { fetchUser } from '@/apis/user';
import images from '@/constants/images';

function RetroHeader({ title }: { title: string }) {
  return (
    <View className="bg-[#6536DD] border-b-2 border-black px-4 py-3 items-center rounded-t-md">
      <View className="relative">
        {[
          [-2, 0],
          [2, 0],
          [0, -2],
          [0, 2],
        ].map(([dx, dy], index) => (
          <Text
            key={index}
            style={{
              position: 'absolute',
              fontFamily: 'PressStart2P',
              fontSize: 12,
              color: 'white',
              left: dx,
              top: dy,
            }}
          >
            {title}
          </Text>
        ))}

        <Text
          style={{
            fontFamily: 'PressStart2P',
            fontSize: 12,
            color: '#F24187',
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

interface AnniversaryWidgetProps {
  className?: string;
  fallbackUserName?: string;
}

export const AnniversaryWidget: React.FC<AnniversaryWidgetProps> = ({
  className = '',
  fallbackUserName = 'Partner',
}) => {
  const { userId } = useAuth();
  const [daysTogether, setDaysTogether] = useState<number | null>(null);
  const [anniversaryDate, setAnniversaryDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  useEffect(() => {
    if (anniversaryDate) {
      calculateDaysTogether();
    }
  }, [anniversaryDate]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const user = await fetchUser(userId!);
      if (user?.anniversary_date) {
        setAnniversaryDate(user.anniversary_date);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDaysTogether = () => {
    if (!anniversaryDate) return;

    const anniversary = new Date(anniversaryDate);
    const today = new Date();

    // Reset time to midnight for accurate day calculation
    anniversary.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const timeDiff = today.getTime() - anniversary.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

    setDaysTogether(daysDiff);
  };

  // Update the count every day at midnight
  useEffect(() => {
    const updateCount = () => {
      calculateDaysTogether();
    };

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(updateCount, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [anniversaryDate]);

  if (isLoading) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="MEMORY" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <Text className="text-center font-pregular text-sm text-black">Loading...</Text>
        </View>
      </View>
    );
  }

  if (!anniversaryDate || daysTogether === null) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="MEMORY" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <Text className="text-center font-pregular text-sm text-black">
            Set your anniversary date in settings to see your relationship milestone
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
      <RetroHeader title="MEMORY" />
      <View className="bg-white px-4 py-4 rounded-b-md flex-1 relative">
        <Image
          source={images.memory}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: 6,
          }}
          resizeMode="cover"
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderBottomLeftRadius: 6,
            borderBottomRightRadius: 6,
            padding: 12,
          }}
        >
          <Text className="font-pbold text-black text-2xl text-center">
            {daysTogether}
          </Text>
          <Text className="font-pregular text-black text-sm text-center">
            Days Together
          </Text>
        </View>
      </View>
    </View>
  );
};
