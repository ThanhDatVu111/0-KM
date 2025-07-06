import React, { useEffect, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import icons from '@/constants/icons';
import { fetchRoom } from '@/apis/room';
import { fetchUser } from '@/apis/user';
import { Feather } from '@expo/vector-icons';
import { usePagination } from '@/hooks/usePagination';

interface ChatHeaderProps {
  room_id: string;
  partnerName?: string;
  avatar_url?: string;
  isOnline?: boolean;
  onBackPress?: () => void;
  onCallPress?: () => void;
  onVideoPress?: () => void;
  onSettingsPress?: () => void;
}

// Helper function to get avatar source with fallback
const getAvatarSource = (avatar_url?: string): ImageSourcePropType => {
  if (avatar_url) {
    return { uri: avatar_url };
  }
  return icons.user_icon_female;
};

export default function ChatHeader({
  room_id,
  partnerName,
  avatar_url,
  isOnline = true,
  onBackPress,
  onCallPress,
  onVideoPress,
  onSettingsPress,
}: ChatHeaderProps) {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.push('/(tabs)/home');

    }
  };

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      router.push('/(tabs)/chat/settings');
    }
  };

  return (
    <View
      className="flex-row items-center bg-white px-4 py-3 rounded-full border-2 border-[#F24187]"
      style={{
        ...Platform.select({
          ios: {
            shadowColor: '#F5829B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          },
          android: {
            elevation: 2,
          },
        }),
      }}
    >
      <TouchableOpacity className="mr-3" onPress={() => router.push('/(tabs)/home')}>
        <Feather name="arrow-left" color="#F24187" size={24} />
      </TouchableOpacity>

      {/* Avatar with fallback to default icon */}
      <Image source={getAvatarSource(avatar_url)} className="w-10 h-10 rounded-lg mr-3" />

      <View className="flex-1">
        <Text className="text-lg font-poppins-medium text-[#F24187]">{partnerName}</Text>
        <Text className="text-sm text-gray-500">{isOnline ? 'Active now' : 'Offline'}</Text>
      </View>

      <TouchableOpacity className="p-2" onPress={onCallPress}>
        <Feather name="phone" color="#F24187" size={24} />
      </TouchableOpacity>

      <TouchableOpacity className="p-2 ml-2" onPress={onVideoPress}>
        <Feather name="video" color="#F24187" size={24} />
      </TouchableOpacity>

      <TouchableOpacity className="p-2" onPress={handleSettingsPress}>
        <Feather name="more-vertical" color="#F24187" size={24} />
      </TouchableOpacity>
    </View>
  );
}
