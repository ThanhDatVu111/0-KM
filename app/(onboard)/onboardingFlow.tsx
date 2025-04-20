import { View, Text, TouchableOpacity, Platform, Image, GestureResponderEvent } from 'react-native';
import { useRouter, useLocalSearchParams} from 'expo-router';
import React, { useState } from 'react';
import FormInput from '@/components/FormInput';
import AuthLayout from '@/components/AuthLayout';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { useAuth, useUser } from '@clerk/clerk-expo';


const onboardingFlow = () => {
  const { email, sessionId } = useLocalSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setFullName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [birthdate, setBirthdate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
    

  const printInfo = () => {
    console.log("email: " + email);
    console.log("name:" + name);
    console.log("birthday:" + birthdate);
  }


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

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const NameStep = () => (
    <AuthLayout activeTab="sign-up" onTabChange={() => {}}>
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
          value={name}
          placeholder="Kevin Nguyen"
          onChangeText={(text: string) => setFullName(text)}
        />

        <TouchableOpacity
          className="bg-accent py-3 rounded-lg w-full items-center mt-6"
          onPress={() => {
            router.push('/birthday');
            setStep((prevStep: number) => prevStep + 1);
          }}
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

  const BirthdayStep = () => (
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

  const PhotoStep = () => (
    <AuthLayout activeTab="sign-up" onTabChange={(tab) => console.log(tab)}>
      <View className="w-[300px] items-center">
        <Text
          className="text-xl text-accent mb-4"
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Upload your profile picture
        </Text>

        {photo ? (
          <Image
            source={{ uri: photo }}
            className="w-32 h-32 rounded-full mb-4"
          />
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            className="border border-accent px-6 py-3 rounded-lg mb-4"
          >
            <Text
              className="text-accent text-base"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Choose Photo
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.replace('/page')} // Update to your real home path
          className="bg-accent py-3 rounded-lg w-full items-center"
        >
          <Text
            className="text-white text-[16px]"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            Finish
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );

  return (
    <View>
      {step === 0 && <NameStep />}
      {step === 1 && <BirthdayStep/>}
      {step === 2 && <PhotoStep />}
    </View>
   );
};

export default onboardingFlow;
function pickImage(event: GestureResponderEvent): void {
    throw new Error('Function not implemented.');
}

//need a console log here to print out all the informations we took from a user -- Zoro
