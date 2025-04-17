import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

export default function BirthdateScreen() {
  const router = useRouter();
  const [birthdate, setBirthdate] = useState(new Date());

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <Text className="text-xl font-bold mb-4">What's your birthdate?</Text>
      <DateTimePicker
        value={birthdate}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          if (selectedDate) setBirthdate(selectedDate);
        }}
      />
      <TouchableOpacity
        className="bg-accent py-3 rounded-lg w-full items-center mt-6"
        onPress={() => router.push('./photo')}
      >
        <Text className="text-white text-base">Next</Text>
      </TouchableOpacity>
    </View>
  );
}
