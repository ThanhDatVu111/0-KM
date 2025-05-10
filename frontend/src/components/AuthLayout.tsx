import React from 'react';
import { View, Text, Image } from 'react-native';
import images from '@/constants/images';
import Button from '@/components/Button';

// import { AuthStrategy, ModalType } from '@/types/enums';
// import { useSSO, useSignIn, useSignUp } from '@clerk/clerk-expo';

// const LOGIN_OPTIONS = [
//   {
//     text: 'Continue with Google',
//     icon: icons.google,
//     strategy: AuthStrategy.Google,
//   }
// ]

interface AuthLayoutProps {
  children: React.ReactNode;
  activeTab: 'sign-in' | 'sign-up';
  onTabChange: (tab: 'sign-in' | 'sign-up' | 'forgot-password') => void;
}

export default function AuthLayout({ children, activeTab, onTabChange }: AuthLayoutProps) {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      {/* logo */}
      <Image source={images.logo} className="w-full max-h-28" resizeMode="contain" />

      {/* tagline */}
      <Text className="text-lg font-poppins-light text-black text-center mb-8">
        Love knows no distance
      </Text>

      {/* tabs */}
      <View className="flex-row mb-5">
        <Button
          label="Login"
          onPress={() => onTabChange('sign-in')}
          className="px-6 pb-1 mb-0" // spacing around
          textClassName={`text-[18px] ${
            activeTab === 'sign-in'
              ? 'font-bold border-b-2 border-b-accent text-accent'
              : 'border-b-transparent text-accent'
          }`}
        />

        <Button
          label="Create Account"
          onPress={() => onTabChange('sign-up')}
          className="px-6 pb-1 mb-0 ml-4"
          textClassName={`text-[18px] ${
            activeTab === 'sign-up'
              ? 'font-bold border-b-2 border-b-accent text-accent'
              : 'border-b-transparent text-accent'
          }`}
        />
      </View>

      {children}
    </View>
  );
}
