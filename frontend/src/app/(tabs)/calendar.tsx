import { View, Text, Image,TouchableOpacity } from 'react-native';
import React from 'react';
import icons from '@/constants/icons';
import useFont from '@/hooks/useFont';
import { useRouter } from 'expo-router';

const connectCalendar = async() => {
  
}

const Calendar = () => {
  const fontsLoaded = useFont();
  const router = useRouter();

  if (!fontsLoaded) {
    return (
      <View className = 'bg-primary flex-1 justify-center'>
        <Text className='text-white'>Loading...</Text>
      </View>
    )
  }

  return (
    <View className="tab-screen">
      <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}>connect to</Text>
      <Image source={icons.googleCalendar} style={{ width: '30%', height: '10%' }} />
      <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}>
        too see mutual availability and
      </Text>
      <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}>
        schedule your next virtual date
      </Text>
      <TouchableOpacity
        onPress={connectCalendar}
        className="bg-calendarButton h-7 w-36 rounded-lg items-center mt-12 justify-center">
        <Text style ={{color: 'white', fontFamily: 'Poppins-SemiBold'}}>connect</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Calendar;
