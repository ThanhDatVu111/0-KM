import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

export default function NameScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <Text className="text-xl font-bold mb-4">What's your name?</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Enter your name"
        className="border border-gray-300 rounded-lg px-4 py-3 w-full mb-4"
      />
      <TouchableOpacity
        className="bg-accent py-3 rounded-lg w-full items-center"
        onPress={() => router.push('./birthday')}
      >
        <Text className="text-white text-base">Next</Text>
      </TouchableOpacity>
    </View>
  );
}
