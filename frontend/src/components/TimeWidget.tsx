import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { usePartnerData } from '@/hooks/usePartnerData';

type TimeWidgetProps = {
  className?: string;
  fallbackUserName?: string;
};

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

export function TimeWidget({ className = '', fallbackUserName = 'Partner' }: TimeWidgetProps) {
  const { partnerData, hasRoom, isLoading } = usePartnerData();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date, timezone?: string) => {
    try {
      if (timezone) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: timezone,
        });
      }
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      // Fallback to local time if timezone is invalid
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const formatDate = (date: Date, timezone?: string) => {
    try {
      if (timezone) {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          timeZone: timezone,
        });
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      // Fallback to local date if timezone is invalid
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const userName = partnerData?.username || fallbackUserName;
  const timezone = partnerData?.timezone;

  if (isLoading) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="TIME" />
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

  if (!hasRoom || !partnerData) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="TIME" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 14,
            }}
            className="text-center text-black"
          >
            {!hasRoom ? 'No partner connected' : 'Partner data unavailable'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
      <RetroHeader title="TIME" />
      <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
        <Text
          style={{
            fontFamily: 'PixelifySans',
            fontSize: 12,
          }}
          className="text-center text-black mb-2"
        >
          {userName}'s time
        </Text>
        <View className="items-center">
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 32,
            }}
            className="text-black"
          >
            {formatTime(currentTime, timezone)}
          </Text>
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 12,
            }}
            className="text-gray-600 mt-1 text-center"
          >
            {formatDate(currentTime, timezone)}
          </Text>
          {timezone && (
            <Text
              style={{
                fontFamily: 'PixelifySans',
                fontSize: 12,
              }}
              className="text-gray-500 mt-1 text-center"
            >
              {timezone}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
