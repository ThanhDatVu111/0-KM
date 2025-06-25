import React from 'react';
import { ImageBackground, View, Image, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import images from '@/constants/images';

interface Props {
  activeTab: 'sign-in' | 'sign-up';
  onTabChange: (tab: 'sign-in' | 'sign-up') => void;
  children: React.ReactNode;
}

export default function AuthLayout({ activeTab, onTabChange, children }: Props) {
  return (
    <ImageBackground
      source={images.entry}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <View className="flex-1 items-center justify-center">
        {/* Retro Auth Container */}
        <View className="w-11/12 max-w-md shadow-2xl border-2 border-black rounded-lg">
          {/* Purple Header Section */}
          <View className="bg-[#6536DD] border-b-4 border-black px-4 py-4 items-center">
            <Image
              source={activeTab === 'sign-in' ? images.SignIn : images.SignUp}
              className="w-48 h-12"
              resizeMode="contain"
              style={{
                tintColor: undefined, // Ensure no color filtering
              }}
            />
          </View>

          {/* White Form Section */}
          <View className="bg-white px-8 py-8 rounded-b-md">
            {children}

            {/* Auth Toggle Link */}
            <View className="mt-6 items-center">
              <TouchableOpacity
                onPress={() => onTabChange(activeTab === 'sign-in' ? 'sign-up' : 'sign-in')}
              >
                <Text className="text-gray-600 text-center">
                  {activeTab === 'sign-in'
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                  <Text className="text-[#6536DD] font-semibold underline">
                    {activeTab === 'sign-in' ? 'Sign up' : 'Sign in'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}
