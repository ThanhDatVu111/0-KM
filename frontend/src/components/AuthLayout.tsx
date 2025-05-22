import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import images from '@/constants/images';
import icons from '@/constants/icons';

interface AuthLayoutProps {
  children: React.ReactNode;
  activeTab: 'sign-in' | 'sign-up';
  onTabChange: (tab: 'sign-in' | 'sign-up' | 'forgot-password') => void;
}

export default function AuthLayout({ children, activeTab, onTabChange }: AuthLayoutProps) {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      // logo
      <Image source={images.logo} className="w-full max-h-28" resizeMode="contain" />
      // tagline
      <Text className="text-lg font-poppins-light text-black text-center mb-8">
        Love knows no distance
      </Text>
      <View className="flex-row mb-5">
        <TouchableOpacity onPress={() => onTabChange('sign-in')}>
          <Text
            className={`text-[18px] px-6 pb-1 border-b-2 ${
              activeTab === 'sign-in'
                ? 'font-bold border-b-accent text-accent'
                : 'border-b-transparent text-accent'
            }`}
          >
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onTabChange('sign-up')}>
          <Text
            className={`text-[18px] px-6 pb-1 border-b-2 ${
              activeTab === 'sign-up'
                ? 'font-bold border-b-accent text-accent'
                : 'border-b-transparent text-accent'
            }`}
          >
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}
