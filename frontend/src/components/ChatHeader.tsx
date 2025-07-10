import React, { useEffect, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import icons from '@/constants/icons';
import { Feather } from '@expo/vector-icons';

interface ChatHeaderProps {
  partnerName?: string;
  avatar_url?: string;
  isOnline: boolean;
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
  partnerName,
  avatar_url,
  isOnline,
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
      className="flex-row items-center px-4 py-3"
      style={{
        backgroundColor: '#FFF0F5',
        borderWidth: 3,
        borderColor: '#B07DE9',
        borderRadius: 16,
      }}
    >
      {/* Retro Back Button */}
      <TouchableOpacity
        className="mr-3"
        onPress={() => router.push('/(tabs)/home')}
        style={{
          backgroundColor: '#FFE4EC',
          borderWidth: 1,
          borderColor: '#220E6D',
          borderRadius: 4,
          padding: 6,
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
        }}
      >
        <Feather name="arrow-left" color="#F24187" size={20} />
      </TouchableOpacity>

      {/* Retro Avatar Frame */}
      <View
        style={{
          backgroundColor: '#FFF0F5',
          borderWidth: 2,
          borderColor: '#220E6D',
          borderRadius: 2,
          padding: 2,
          marginRight: 12,
          shadowColor: '#000',
          shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 0.5,
          shadowRadius: 0,
        }}
      >
        <Image
          source={getAvatarSource(avatar_url)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 2,
          }}
        />
      </View>

      <View className="flex-1">
        <Text
          style={{
            fontFamily: 'PixelifySans',
            fontSize: 16,
            fontWeight: 'bold',
            color: '#220E6D',
            textShadowColor: '#FDA3D4',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 0,
          }}
        >
          {partnerName}
        </Text>
        <Text
          style={{
            fontFamily: 'PixelifySans',
            fontSize: 11,
            color: isOnline ? '#27AE60' : '#E74C3C',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          {isOnline ? '● ONLINE' : '● OFFLINE'}
        </Text>
      </View>

      {/* Retro Action Buttons */}
      <TouchableOpacity
        onPress={onCallPress}
        style={{
          backgroundColor: '#A673E7',
          borderWidth: 2,
          borderColor: '#220E6D',
          borderRadius: 4,
          padding: 6,
          marginRight: 6,
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
        }}
      >
        <Feather name="phone" color="#FFF" size={18} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onVideoPress}
        style={{
          backgroundColor: '#F24187',
          borderWidth: 2,
          borderColor: '#220E6D',
          borderRadius: 4,
          padding: 6,
          marginRight: 6,
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
        }}
      >
        <Feather name="video" color="#FFF" size={18} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSettingsPress}
        style={{
          backgroundColor: '#FDA3D4',
          borderWidth: 2,
          borderColor: '#220E6D',
          borderRadius: 4,
          padding: 6,
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
        }}
      >
        <Feather name="more-vertical" color="#220E6D" size={18} />
      </TouchableOpacity>
    </View>
  );
}
