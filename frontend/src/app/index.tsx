import React from 'react';
import { ImageBackground, TouchableOpacity, Image, View, Text } from 'react-native';
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

        <View className="w-full items-center mt-4">
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            {/* Four white border layers for pixel outline */}
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
                  fontFamily: 'PressStart2P-Regular',
                  fontSize: 15,
                  color: '#FFF',
                  left: dx,
                  top: dy,
                  textAlign: 'center',
                  letterSpacing: 1,
                }}
              >
                Love Knows No Distance
              </Text>
            ))}
            {/* Foreground text */}
            <Text
              style={{
                fontFamily: 'PressStart2P-Regular',
                fontSize: 15,
                color: '#6536DA',
                textAlign: 'center',
                letterSpacing: 1,
              }}
            >
              Love Knows No Distance
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <TouchableOpacity
            onPress={() => router.push('../(auth)/authscreen')}
            disabled={isSignedIn}
            style={{
              marginTop: 0,
              opacity: isSignedIn ? 0.5 : 1,
            }}
          >
            <Image
              source={images.startButton}
              style={{ width: 288, height: 56 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
