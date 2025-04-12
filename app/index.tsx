import React from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import useFont from './(hooks)/useFont'; 

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
    <View className="flex-1 items-center justify-center bg-primary px-6">
      {/* Logo */}
      <View className="mt-20 mb-6 w-full items-center">
        <Image
          source={require('../assets/images/logo.png')}
          className="w-28 h-28"
          resizeMode="contain"
        />
      </View>

      {/* Polaroid Image */}
      <View className="w-full items-center mb-4">
        <Image
          source={require('../assets/images/0km_polaroid.png')}
          className="w-[60px] h-[60px]"
          resizeMode="contain"
        />
      </View>

      {/* Subtitle */}
      <Text
        className="text-center text-base text-accent mt-2"
        style={{ fontFamily: 'Poppins-Regular' }}
      >
        One journey, two hearts, zero distance
      </Text>

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
    </View>
  );
}