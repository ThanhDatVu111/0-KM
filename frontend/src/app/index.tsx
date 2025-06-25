import React from 'react';
import { ImageBackground, TouchableOpacity, Image, View } from 'react-native';
import { router } from 'expo-router';
import images from '@/constants/images';
import { useAuth } from '@clerk/clerk-expo';

export default function Index() {
  const { isSignedIn } = useAuth();
  return (
    <ImageBackground
      source={images.entry}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <View className="flex-1 items-center">
        <View className="w-full items-center mt-44">
          <Image source={images.logo} className="w-60 h-28" resizeMode="contain" />
        </View>

        <View className="items-center mt-96 py-16">
          <TouchableOpacity
            onPress={() => router.push('../(auth)/authscreen')}
            disabled={isSignedIn}
            style={{
              marginTop: 32,
              opacity: isSignedIn ? 0.5 : 1,
            }}
          >
            <Image
              source={images.startButton}
              style={{ width: 288, height: 56 }} // Adjust as needed
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
