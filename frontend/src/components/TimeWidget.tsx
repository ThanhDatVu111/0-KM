import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePartnerData } from '@/hooks/usePartnerData';

type TimeWidgetProps = {
  className?: string;
  fallbackUserName?: string;
};

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
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 ${className}`}
        style={{ borderWidth: 1.5, borderRadius: 16 }}
      >
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
        <Text className="mb-2 font-pregular text-sm text-white">{fallbackUserName}'s time</Text>
        <View className="flex-1 items-center justify-center">
          <Text className="font-pregular text-sm text-white">Loading...</Text>
        </View>
      </View>
    );
  }

  if (!hasRoom || !partnerData) {
    return (
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 ${className}`}
        style={{ borderWidth: 1.5, borderRadius: 16 }}
      >
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
        <Text className="mb-2 font-pregular text-sm text-white">{fallbackUserName}'s time</Text>
        <View className="flex-1 items-center justify-center">
          <Text className="font-pregular text-sm text-white text-center">
            {!hasRoom ? 'No partner connected' : 'Partner data unavailable'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 ${className}`}
      style={{ borderWidth: 1.5, borderRadius: 16 }}
    >
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
      <Text className="mb-2 font-pregular text-sm text-white">{userName}'s time</Text>
      <View className="flex-1 items-center justify-center">
        <Text className="font-pbold text-5xl text-white">{formatTime(currentTime, timezone)}</Text>
        <Text className="font-pregular text-sm text-white/80 mt-2">
          {formatDate(currentTime, timezone)}
        </Text>
        {timezone && <Text className="font-pregular text-xs text-white/60 mt-1">{timezone}</Text>}
      </View>
    </View>
  );
}
