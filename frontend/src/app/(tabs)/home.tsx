import { View, Text } from 'react-native';
import React from 'react';
import { SignOutButton } from '@/components/SignOutButton';

const Home = () => {
  return (
    <View className="tab-screen">
      <Text>this is home</Text>
      <SignOutButton />
    </View>
  );
};

export default Home;
