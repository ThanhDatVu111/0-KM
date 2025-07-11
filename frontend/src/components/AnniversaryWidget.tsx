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
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 14,
            }}
            className="text-center text-black"
          >
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  if (!anniversaryDate || daysTogether === null) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="MEMORY" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 14,
            }}
            className="text-center text-black"
          >
            Set your anniversary date in settings to see your relationship milestone
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
      <RetroHeader title="MEMORY" />
      <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center items-center">
        {/* Heart Icon */}
        <Image
          source={images.heart}
          style={{
            width: 48,
            height: 48,
            marginBottom: 12,
          }}
          resizeMode="contain"
        />

        {/* Days Count */}
        <Text
          style={{
            fontFamily: 'PixelifySans',
            fontSize: 32,
          }}
          className="text-black text-center mb-1"
        >
          {daysTogether}
        </Text>

        {/* Label */}
        <Text
          style={{
            fontFamily: 'PixelifySans',
            fontSize: 14,
          }}
          className="text-black text-center"
        >
          Days Together
        </Text>
      </View>
    </View>
  );
};
