import React from 'react';
import { ImageBackground, TouchableOpacity, Image, View, Text } from 'react-native';
import { router } from 'expo-router';
import images from '@/constants/images';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const { isSignedIn, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  return (
    <ImageBackground
      source={images.entry}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      {/* Logout Button - Top Right */}
      {isSignedIn && (
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            position: 'absolute',
            top: 60,
            right: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 25,
            padding: 12,
            zIndex: 10,
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      )}

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
