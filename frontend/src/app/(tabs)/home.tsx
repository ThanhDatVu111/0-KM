import { View, Text } from 'react-native';
import React from 'react';
import { SignOutButton } from '@/components/SignOutButton';
import { useLocalSearchParams } from 'expo-router';

const Home = () => {
  const { user_id } = useLocalSearchParams();
  console.log('user id:', user_id);
  return (
    <View className="tab-screen">
      <Text>this is home</Text>
      <SignOutButton />
    </View>
  );
};

export default Home;
