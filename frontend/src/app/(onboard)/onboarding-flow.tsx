import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  Platform,
  Image,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import FormInput from '@/components/FormInput';
import images from '@/constants/images';
import { useLocalSearchParams } from 'expo-router';
import { onboardUser } from '@/apis/user';

function RetroHeader({ title }: { title: string }) {
  return (
    <View className="bg-[#6536DD] border-b-4 border-black px-4 py-6 items-center rounded-t-md">
      <View className="relative">
        {[
          [-3, 0],
          [3, 0],
          [0, -3],
          [0, 3],
        ].map(([dx, dy], index) => (
          <Text
            key={index}
            style={{
              position: 'absolute',
              fontFamily: 'PressStart2P',
              fontSize: 24,
              color: 'white',
              left: dx,
              top: dy,
            }}
          >
            {title}
          </Text>
        ))}

        <Text
          style={{
            fontFamily: 'PressStart2P',
            fontSize: 24,
            color: '#F24187',
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

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
    <View className="w-11/12 max-w-md shadow-2xl border-4 border-black rounded-lg">
      {/* Purple Header Section */}
      <RetroHeader title="Onboarding" />

      {/* White Form Section */}
      <View className="bg-white px-8 py-8 rounded-b-md">
        <FormInput
          label="Your Name"
          borderColor="#6536DD"
          value={name}
          placeholder="Enter your name"
          onChangeText={setName}
        />

        <TouchableOpacity
          onPress={onNext}
          disabled={!name.trim()}
          className="w-full mb-4 bg-[#6536DD] border-4 border-black"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
            opacity: !name.trim() ? 0.5 : 1,
          }}
        >
          <View className="bg-[#6536DD] px-4 py-3">
            <Text
              className="text-white text-center text-[16px] font-bold"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              NEXT
            </Text>
          </View>
        </TouchableOpacity>
      </View>
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
    <View className="w-11/12 max-w-md shadow-2xl border-4 border-black rounded-lg">
      {/* Purple Header Section */}
      <RetroHeader title="Onboarding" />

      {/* White Form Section */}
      <View className="bg-white px-8 py-8 rounded-b-md">
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          className="w-full mb-6 bg-[#6536DD] border-4 border-black"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
          }}
        >
          <View className="bg-[#6536DD] px-4 py-3">
            <Text
              className="text-white text-center text-[16px] font-bold"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              {birthdate.toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>

        {showPicker && (
          <View className="mb-6">
            <DateTimePicker
              value={birthdate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
            />
          </View>
        )}

        <View className="flex-row justify-between w-full gap-4">
          <TouchableOpacity
            onPress={onPrevious}
            className="flex-1 bg-gray-400 border-4 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
            }}
          >
            <View className="bg-gray-400 px-4 py-3">
              <Text
                className="text-white text-center text-[16px] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                PREVIOUS
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNext}
            className="flex-1 bg-[#6536DD] border-4 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
            }}
          >
            <View className="bg-[#6536DD] px-4 py-3">
              <Text
                className="text-white text-center text-[16px] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                NEXT
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
    <View className="w-11/12 max-w-md shadow-2xl border-4 border-black rounded-lg">
      {/* Purple Header Section */}
      <RetroHeader title="Onboarding" />

      {/* White Form Section */}
      <View className="bg-white px-8 py-8 rounded-b-md items-center">
        {photo ? (
          <View className="mb-6 items-center">
            <Image
              source={{ uri: photo }}
              className="w-32 h-32 rounded-full border-4 border-[#6536DD]"
            />
            <TouchableOpacity
              onPress={() => pickImage(setPhoto)}
              className="mt-4 bg-white border-4 border-[#6536DD]"
              style={{
                shadowColor: '#6536DD',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 8,
              }}
            >
              <View className="bg-white px-4 py-2">
                <Text
                  className="text-[#6536DD] text-center text-[14px] font-bold"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  CHANGE PHOTO
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => pickImage(setPhoto)}
            className="w-full mb-6 bg-[#6536DD] border-4 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
            }}
          >
            <View className="bg-[#6536DD] px-4 py-3">
              <Text
                className="text-white text-center text-[16px] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                CHOOSE PHOTO
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {onPrevious && (
          <TouchableOpacity
            onPress={onPrevious}
            className="w-full mb-4 bg-gray-400 border-4 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
            }}
          >
            <View className="bg-gray-400 px-4 py-3">
              <Text
                className="text-white text-center text-[16px] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                PREVIOUS
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onFinish}
          className="w-full bg-[#6536DD] border-4 border-black"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
          }}
        >
          <View className="bg-[#6536DD] px-4 py-3">
            <Text
              className="text-white text-center text-[16px] font-bold"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              FINISH ONBOARDING
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** --- Main Onboarding Flow --- */
const OnboardingFlow = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const { user_id } = useLocalSearchParams();
  const router = useRouter();

  const handleFinish = async () => {
    try {
      const user = await onboardUser({
        user_id: user_id as string,
        name: name,
        birthdate: birthdate.toISOString(),
        photo_url: photo || '',
      });
      console.log('✅ User updated (onboard) in database:', user);
      router.push('/(onboard)/join-room');
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

  return (
    <ImageBackground
      source={images.onboardPairingBg}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 items-center justify-center px-4 py-8">{steps[step]}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default OnboardingFlow;
