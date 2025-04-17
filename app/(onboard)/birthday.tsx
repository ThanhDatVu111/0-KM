import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';

export default function BirthdateScreen() {
  const router = useRouter();
  const [birthdate, setBirthdate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    // Dismiss the picker after selecting
    if (Platform.OS === 'android') setShowPicker(false);

    if (selectedDate) {
      setBirthdate(selectedDate);
    }
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  return (
    <AuthLayout activeTab="sign-up" onTabChange={(tab) => console.log(tab)}>
      <View className="w-[300px] items-center">
        <Text
          className="text-xl text-accent mb-4 text-center"
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          What's your birthdate?
        </Text>

        {/* Date display + open picker */}
        <TouchableOpacity
          onPress={showDatePicker}
          className="bg-white border border-accent rounded-lg px-4 py-3 w-full mb-4"
        >
          <Text
            className="text-center text-black"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {birthdate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {/* Actual picker */}
        {showPicker && (
          <DateTimePicker
            value={birthdate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
        )}

        <TouchableOpacity
          className="bg-accent py-3 rounded-lg w-full items-center mt-4"
          onPress={() => router.push('/photo')}
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
