import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

interface AuthLayoutProps {
  children: React.ReactNode;
  activeTab: 'sign-in' | 'sign-up';
  onTabChange: (tab: 'sign-in' | 'sign-up' | 'forgot-password') => void;
}

export default function AuthLayout({
  children,
  activeTab,
  onTabChange,
}: AuthLayoutProps) {
  return (
    <View className="flex-1 justify-center items-center bg-primary">
      {/* Logo */}
      <Image
        source={require('../assets/images/logo.png')}
        className="w-[200px] h-[200px] mb-5"
        resizeMode="contain"
      />

      {/* Tagline */}
      <Text
        className="text-[18px] text-black text-center mb-8 font-light"
        style={{ fontFamily: 'Poppins-Light' }}
      >
        Love knows no distance
      </Text>

      {/* Tabs */}
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

      {/* Auth Forms */}
      {children}
    </View>
  );
}