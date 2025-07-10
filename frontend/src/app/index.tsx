import React from 'react';
import { ImageBackground, TouchableOpacity, Image, View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import images from '@/constants/images';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const { isSignedIn, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('✅ Successfully signed out');
            } catch (error) {
              console.error('❌ Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ImageBackground
      source={images.entry}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      {/* Sign Out Button - Top Right */}
      {isSignedIn && (
        <View className="absolute top-16 right-5 z-50">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-white/20 rounded-full p-3"
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
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
