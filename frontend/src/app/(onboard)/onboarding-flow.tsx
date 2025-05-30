import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, Platform, Image, TextInput} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import Button from '@/components/Button';
import { useLocalSearchParams } from 'expo-router';
import { onboardUser } from '@/apis/user';
import { createRoom } from '@/apis/room';
import uuid from 'react-native-uuid';

/** --- Step 1: NameEntry --- */
function NameStep({
  name,
  setName,
  onNext,
}: {
  name: string;
  setName: (s: string) => void;
  onNext: () => void;
}) {
  return (
    <View className="w-full max-w-xs">
      <Text className="text-2xl font-bold text-accent mb-4 text-center">What’s your name?</Text>
      <TextInput
        className="border border-accent rounded-lg px-4 py-2 mb-6"
        value={name}
        placeholder="Your name"
        onChangeText={setName}
      />
      <Button
        label="Next"
        onPress={onNext}
        size="py-4 px-8"
        color="bg-accent"
        className="w-full"
        textClassName="text-white text-base font-medium"
      />
    </View>
  );
}

/** --- Step 2: BirthdayEntry --- */
function BirthdayStep({
  birthdate,
  setBirthdate,
  showPicker,
  setShowPicker,
  onNext,
  onPrevious,
}: {
  birthdate: Date;
  setBirthdate: (d: Date) => void;
  showPicker: boolean;
  setShowPicker: (b: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  // Hides the Android date-picker once user pick (or cancel) and, if
  // user actually picked a date, updates your birthdate state.
  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setBirthdate(selected);
  };

  return (
    <View className="w-full max-w-xs items-center">
      <Text className="text-2xl font-bold text-accent mb-4 text-center">
        What’s your birthdate?
      </Text>
      <Button
        label={birthdate.toLocaleDateString()}
        onPress={() => setShowPicker(true)}
        size="px-4 py-3"
        color="bg-accent"
        className="w-full"
        textClassName="text-white text-base font-medium"
      />
      {showPicker && (
        <DateTimePicker
          value={birthdate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
      <View className="flex-row justify-between w-full">
        <Button
          label="Previous"
          onPress={onPrevious}
          size="px-4 py-3"
          color="bg-gray-400"
          className="w-1/2 mr-2"
          textClassName="text-white text-base font-medium"
        />
        <Button
          label="Next"
          onPress={onNext}
          size="px-4 py-3"
          color="bg-accent"
          className="w-1/2 ml-2"
          textClassName="text-white text-base font-medium"
        />
      </View>
    </View>
  );
}

/** --- Step 3: PhotoEntry --- */

// That launchImageLibraryAsync call itself returns a Promise that only settles once the user
// either picks an image or cancels. By using await, you pause execution until that happens.
// Once the user has made their choice, your function continues, calls setPhoto(...), then
// finishes—resolving its returned promise.

async function pickImage(setPhoto: (uri: string) => void) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
  //if canceled is true, assets will be an empty array, and if assets has items then canceled will be false.
  if (!result.canceled && result.assets.length > 0) {
    setPhoto(result.assets[0].uri);
  }
}

function PhotoStep({
  photo,
  setPhoto,
  onFinish,
  onPrevious,
}: {
  photo: string | null;
  setPhoto: (uri: string) => void;
  onFinish: () => void;
  onPrevious?: () => void;
}) {
  return (
    <View className="w-full max-w-xs items-center">
      <Text className="text-2xl font-bold text-accent mb-4 text-center">
        Upload your profile picture
      </Text>
      {photo ? (
        <Image source={{ uri: photo }} className="w-32 h-32 rounded-full mb-6" />
      ) : (
        <Button
          label="Choose Photo"
          onPress={() => pickImage(setPhoto)}
          size="px-4 py-3"
          color="bg-accent"
          className="w-full"
          textClassName="text-white text-base font-medium"
        />
      )}
      {onPrevious && (
        <Button
          label="Previous"
          onPress={onPrevious}
          size="px-4 py-3"
          color="bg-gray-400"
          className="w-full mb-4"
          textClassName="text-white text-base font-medium"
        />
      )}
      <Button
        label="Finish onboarding"
        onPress={onFinish} // Still using `onFinish` to go to next step (setStep(3))
        size="px-4 py-3"
        color="bg-accent"
        className="w-full"
        textClassName="text-white text-base font-medium"
      />
    </View>
  );
}

/** --- Main Onboarding Flow (NativeWind) --- */
const OnboardingFlow = () => {
  //Note: This page still need to work on the UI to make it look consistent with the rest of the app.

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const {user_id} = useLocalSearchParams();
  const router = useRouter();
  const roomId = uuid.v4(); 

  const handleFinish = async () => {
    try {
      const user = await onboardUser({
        user_id: user_id as string,
        name: name,
        birthdate: birthdate.toISOString(),
        photo_url: photo || '',
      });

      console.log('✅ User updated (onboard) in database:', user);

      const room = await createRoom({
        room_id: roomId as string,
        user_1: user_id as string,
      });

      console.log('✅ Room created:', room);

      // Navigate only if both user and room creation are successful
      router.push({
        pathname: '/(onboard)/join-room',
        params: {
          userId: user_id,
          roomId: roomId,
        },
      });
    } catch (err) {
      console.error('❌ Error onboarding user or creating room:', err);
    }
  };
  const steps = [
    <NameStep key="1" name={name} setName={setName} onNext={() => setStep(1)} />,
    <BirthdayStep
      key="2"
      birthdate={birthdate}
      setBirthdate={setBirthdate}
      showPicker={showPicker}
      setShowPicker={setShowPicker}
      onPrevious={() => setStep(0)}
      onNext={() => setStep(2)}
    />,
    <PhotoStep
      key="3"
      photo={photo}
      setPhoto={setPhoto}
      onPrevious={() => setStep(1)}
      onFinish={() => handleFinish()}
    />,
  ];

  return <View className="flex-1 items-center justify-center bg-primary px-4">{steps[step]}</View>;
};

export default OnboardingFlow;