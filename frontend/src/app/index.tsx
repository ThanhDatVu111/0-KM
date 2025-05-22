import React from 'react';
import { Text, View, Image, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import useFont from '../hooks/useFont';

//constants
import images from '@/constants/images';
import Button from '@/components/Button';

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
      <View className="flex-1 items-center justify-center">
        {/* Logo */}
        <View className="w-full items-center">
          <Image source={images.logo} className="w-40 h-28" resizeMode="contain" />
        </View>

        <View className="w-full h-3/4 items-center">
          <Image source={images.polaroid} className="justify-center h-2/3" resizeMode="contain" />

          {/* Login Button */}
          <Button
            label="Let’s login"
            onPress={() => router.push('../(auth)/signin')}
            size="w-72 mt-8 px-6 py-4"
            color="bg-accent"
            textClassName="text-white text-lg text-center"
          />

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
