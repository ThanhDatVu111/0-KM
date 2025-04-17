import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';

export default function NameScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');

  return (
    <AuthLayout activeTab="sign-up" onTabChange={(tab) => console.log(tab)}>
      <View className="w-[300px]">
        <Text
          className="text-xl text-accent mb-2"
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          What's your name?
        </Text>

        <FormInput
          label="Your Name"
          borderColor="#F5829B"
          value={fullName}
          placeholder="Kevin Nguyen"
          onChangeText={setFullName}
        />

        <TouchableOpacity
          className="bg-accent py-3 rounded-lg w-full items-center mt-6"
          onPress={() => router.push('/birthday')}
        >
          <Text
            className="text-white text-[16px]"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}
