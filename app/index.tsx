import React from 'react';
import { Text, View, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import useFont from './(hooks)/useFont'; 

//constants
import images from '@/constants/images';
import icons from '@/constants/icons';

export default function Index() {
  const fontsLoaded = useFont();

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-primary">
        <Text className="text-lg text-white">Loading...</Text>
      </View>
    );
  }
  return (
    <SafeAreaView className="flex h-full bg-primary items-center justify-between">
      <View className="flex-1 items-center justify-center bg-primary px-6">
      {/* Logo */}
        <View className="w-full items-center mb-6">
          <Image
            source={images.logo}
            className="w-full max-h-28"
            resizeMode="contain"
          />
      </View>

      <View className="w-full h-3/4 items-center">
        {/* Polaroid Image */}
        <Image
          source={images.polaroid}
          className="justify-center h-2/3"
          resizeMode="contain"
        />

        {/* Login Button */}
        <TouchableOpacity
        onPress={() => router.push('../(auth)/signin')}
        className="w-72 mt-8 bg-accent px-6 py-4 rounded-full"
      >
          <Text
            className="text-white text-lg text-center"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Let’s login
          </Text>    
        </TouchableOpacity>

        {/* Subtitle */}
        <Text
          className="text-center text-base text-accent mt-2"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          One journey, two hearts, zero distance
        </Text>
      </View>
    </View>
    </SafeAreaView>
  );
}