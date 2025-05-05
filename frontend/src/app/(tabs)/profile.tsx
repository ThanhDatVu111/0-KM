import { View, Text } from 'react-native';
import React from 'react';
import { SignOutButton } from '@/components/SignOutButton';

const profile = () => {
  return (
    <View className="flex-1 justify-center items-center bg-primary">
      <Text className="mb-10">profile</Text>
      <SignOutButton />
    </View>
  );
};

export default profile;
