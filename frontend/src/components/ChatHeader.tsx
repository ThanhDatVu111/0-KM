import React, { Component } from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import icons from '@/constants/icons';
import { recipient, sender } from '@/constants/chat';
import { router } from 'expo-router';

const ChatHeader = () => {
  return (
    <View
      className="flex-row items-center bg-white px-4 py-3 rounded-full"
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
        <Text className="text-lg text-[#F5829B]">←</Text>
      </TouchableOpacity>

      <Image source={icons.user_icon_female} className="w-10 h-10 rounded-lg mr-3" />

      <View className="flex-1">
        <Text className="text-lg font-poppins-medium text-black">{recipient.username}</Text>
        <Text className="text-sm text-gray-500 gap-2">Active now</Text>
      </View>

      <TouchableOpacity className="p-2">
        <Image source={icons.phone} className="w-6 h-6" />
      </TouchableOpacity>

      <TouchableOpacity className="p-2 ml-2">
        <Image source={icons.video} className="w-6 h-6" />
      </TouchableOpacity>
    </View>
  );
};

export default ChatHeader;
