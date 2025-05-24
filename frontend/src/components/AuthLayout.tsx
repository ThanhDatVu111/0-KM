import React from 'react';
import { View, Text, Image } from 'react-native';
import images from '@/constants/images';
import Button from '@/components/Button';

interface Props {
  activeTab: 'sign-in' | 'sign-up';
  onTabChange: (tab: 'sign-in' | 'sign-up') => void;
  children: React.ReactNode;
}

export default function AuthLayout({ activeTab, onTabChange, children }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-primary px-6">
      {/* Logo */}
      <Image source={images.logo} className="w-full max-h-28 mt-10" resizeMode="contain" />

      {/* Tagline */}
      <Text className="text-lg font-poppins-light text-black text-center mb-8">
        Love knows no distance
      </Text>

      {/* Tabs */}
      <View className="flex-row mb-2">
        <Button
          label="Login"
          onPress={() => onTabChange('sign-in')}
          className={`px-6 pb-1 ${
            activeTab === 'sign-in' ? 'border-b-2 border-b-accent' : 'border-b-transparent'
          }`}
          textClassName={`text-[18px] ${
            activeTab === 'sign-in' ? 'font-bold text-accent' : 'text-accent'
          }`}
        />

        <Button
          label="Create Account"
          onPress={() => onTabChange('sign-up')}
          className={`px-6 pb-1 ml-4 ${
            activeTab === 'sign-up' ? 'border-b-2 border-b-accent' : 'border-b-transparent'
          }`}
          textClassName={`text-[18px] ${
            activeTab === 'sign-up' ? 'font-bold text-accent' : 'text-accent'
          }`}
        />
      </View>

      {/* Form */}
      <View>{children}</View>
    </View>
  );
}