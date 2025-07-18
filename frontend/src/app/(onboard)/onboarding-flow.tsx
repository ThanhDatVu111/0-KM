import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import FormInput from '@/components/FormInput';
import images from '@/constants/images';
import { useLocalSearchParams } from 'expo-router';
import { onboardUser } from '@/apis/user';
import { uploadToCloudinary } from '@/utils/cloudinaryUpload';

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
  uploading,
}: {
  photo: string | null;
  setPhoto: (uri: string) => void;
  onFinish?: () => void;
  onPrevious?: () => void;
  uploading: boolean;
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
              disabled={uploading}
              className="mt-4 bg-white border-4 border-[#6536DD]"
              style={{
                shadowColor: '#6536DD',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 8,
                opacity: uploading ? 0.5 : 1,
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
            disabled={uploading}
            className="w-full mb-6 bg-[#6536DD] border-4 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
              opacity: uploading ? 0.5 : 1,
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
            disabled={uploading}
            className="w-full mb-4 bg-gray-400 border-4 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
              opacity: uploading ? 0.5 : 1,
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
          disabled={uploading}
          className="w-full bg-[#6536DD] border-4 border-black"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <View className="bg-[#6536DD] px-4 py-3">
            {uploading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                <Text
                  className="text-white text-center text-[14px] font-bold"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  UPLOADING...
                </Text>
              </View>
            ) : (
              <Text
                className="text-white text-center text-[16px] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                NEXT
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** --- Step 4: AnniversaryStep --- */
function AnniversaryStep({
  anniversaryDate,
  setAnniversaryDate,
  showPicker,
  setShowPicker,
  onNext,
  onPrevious,
}: {
  anniversaryDate: Date;
  setAnniversaryDate: (d: Date) => void;
  showPicker: boolean;
  setShowPicker: (b: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  // Hides the Android date-picker once user pick (or cancel) and, if
  // user actually picked a date, updates your anniversary date state.
  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setAnniversaryDate(selected);
  };

  return (
    <View className="w-11/12 max-w-md shadow-2xl border-4 border-black rounded-lg">
      {/* Purple Header Section */}
      <RetroHeader title="Onboarding" />

      {/* White Form Section */}
      <View className="bg-white px-8 py-8 rounded-b-md">
        <View className="mb-6 items-center">
          <Ionicons name="heart" size={48} color="#6536DD" />
          <Text
            className="text-center text-lg font-bold mt-2"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            When did you start dating?
          </Text>
          <Text
            className="text-center text-sm text-gray-600 mt-2"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            This will help us track your relationship milestones
          </Text>
        </View>

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
              {anniversaryDate.toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>

        {showPicker && (
          <View className="mb-6">
            <DateTimePicker
              value={anniversaryDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
            />
          </View>
        )}

        {/* Show selected date confirmation */}
        {!showPicker && (
          <View className="mb-6 items-center">
            <View className="bg-gray-50 border-2 border-[#6536DD] rounded-lg p-4 w-full">
              <Text className="text-center font-bold mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
                📅 Your Anniversary Date
              </Text>
              <Text
                className="text-center text-lg text-[#6536DD] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                {anniversaryDate.toLocaleDateString()}
              </Text>
              <Text
                className="text-center text-sm text-gray-600 mt-2"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                {anniversaryDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
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

/** --- Step 5: LocationStep --- */
function LocationStep({
  location,
  setLocation,
  timezone,
  setTimezone,
  onFinish,
  onPrevious,
  uploading,
}: {
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  } | null;
  setLocation: (
    loc: {
      latitude: number;
      longitude: number;
      city: string;
      country: string;
    } | null,
  ) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  onFinish: () => void;
  onPrevious: () => void;
  uploading: boolean;
}) {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      
      const { status } = await Location.requestForegroundPermissionsAsync();
    

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your weather and time to your partner. You can skip this step and set it later in settings.',
        );
        setIsDetecting(false);
        return;
      }


      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
   

      // Get city and country from coordinates
    
      const geocodeResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
    
      if (geocodeResult.length > 0) {
        const address = geocodeResult[0];
        const locationData = {
          latitude,
          longitude,
          city: address.city || 'Unknown City',
          country: address.country || 'Unknown Country',
        };
       
        setLocation(locationData);
      } else {
        const locationData = {
          latitude,
          longitude,
          city: 'Unknown City',
          country: 'Unknown Country',
        };
        
        setLocation(locationData);
      }

      // Get timezone
      try {
        const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
       
        setTimezone(timezoneName);
      } catch (error) {
        console.error('Error getting timezone:', error);
        setTimezone('UTC');
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      Alert.alert(
        'Error',
        'Failed to detect your location. You can skip this step and set it later.',
      );
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <View className="w-11/12 max-w-md shadow-2xl border-4 border-black rounded-lg">
      {/* Purple Header Section */}
      <RetroHeader title="Onboarding" />

      {/* White Form Section */}
      <View className="bg-white px-8 py-8 rounded-b-md items-center">
        <View className="mb-6 items-center">
          <Ionicons name="location" size={48} color="#6536DD" />
          <Text
            className="text-center text-lg font-bold mt-2"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Location & Timezone
          </Text>
          <Text
            className="text-center text-sm text-gray-600 mt-2"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            This helps your partner see your local time and weather
          </Text>
        </View>

        {location ? (
          <View className="w-full mb-6 bg-gray-50 border-2 border-[#6536DD] rounded-lg p-4">
            <Text className="text-center font-bold mb-2" style={{ fontFamily: 'Poppins-Bold' }}>
              📍 {location.city}, {location.country}
            </Text>
            <Text
              className="text-center text-sm text-gray-600"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              🕐 {timezone}
            </Text>
            <TouchableOpacity
              onPress={detectLocation}
              disabled={isDetecting}
              className="mt-3 bg-white border-2 border-[#6536DD] rounded-lg"
            >
              <View className="px-4 py-2">
                <Text
                  className="text-[#6536DD] text-center text-sm font-bold"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  {isDetecting ? 'Detecting...' : 'Update Location'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={detectLocation}
            disabled={isDetecting}
            className="w-full mb-6 bg-[#6536DD] border-4 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
              opacity: isDetecting ? 0.5 : 1,
            }}
          >
            <View className="bg-[#6536DD] px-4 py-3">
              <Text
                className="text-white text-center text-[16px] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                {isDetecting ? 'DETECTING LOCATION...' : 'DETECT MY LOCATION'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

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

        <TouchableOpacity
          onPress={onFinish}
          disabled={uploading}
          className="w-full bg-[#6536DD] border-4 border-black"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <View className="bg-[#6536DD] px-4 py-3">
            {uploading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                <Text
                  className="text-white text-center text-[14px] font-bold"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  UPLOADING...
                </Text>
              </View>
            ) : (
              <Text
                className="text-white text-center text-[16px] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                {location ? 'FINISH ONBOARDING' : 'SKIP & FINISH'}
              </Text>
            )}
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
  const [anniversaryDate, setAnniversaryDate] = useState(new Date());
  const [showAnniversaryPicker, setShowAnniversaryPicker] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  } | null>(null);
  const [timezone, setTimezone] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { user_id } = useLocalSearchParams();
  const router = useRouter();

  const handleFinish = async () => {
    setUploading(true);
    try {
      console.log('📍 Onboarding finish - location data:', location);
      console.log('📍 Onboarding finish - timezone:', timezone);
      console.log('📍 Onboarding finish - location_latitude:', location?.latitude);
      console.log('📍 Onboarding finish - location_longitude:', location?.longitude);
      console.log('📍 Onboarding finish - location_city:', location?.city);
      console.log('📍 Onboarding finish - location_country:', location?.country);
      console.log('📍 Onboarding finish - anniversary_date:', anniversaryDate.toISOString());

      let photoUrl = '';

      // Upload photo to Cloudinary if one was selected
      if (photo) {
        try {
          console.log('🔄 Uploading onboarding photo to Cloudinary...');
          photoUrl = await uploadToCloudinary(photo, 'image');
          console.log('✅ Onboarding photo uploaded to:', photoUrl);
        } catch (uploadErr: any) {
          console.error('❌ Failed to upload onboarding photo:', uploadErr);
          Alert.alert('Upload Error', 'Failed to upload profile photo. Please try again.');
          setUploading(false);
          return;
        }
      }

      const user = await onboardUser({
        user_id: user_id as string,
        name: name,
        birthdate: birthdate.toISOString(),
        photo_url: photoUrl,
        timezone: timezone || undefined,
        location_latitude: location?.latitude || undefined,
        location_longitude: location?.longitude || undefined,
        location_city: location?.city || undefined,
        location_country: location?.country || undefined,
        anniversary_date: anniversaryDate.toISOString(),
      });
      console.log('✅ User updated (onboard) in database:', user);
      router.push('/(onboard)/join-room');
    } catch (err) {
      console.error('❌ Error onboarding user or creating room:', err);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setUploading(false);
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
      onFinish={() => setStep(3)}
      uploading={uploading}
    />,
    <AnniversaryStep
      key="4"
      anniversaryDate={anniversaryDate}
      setAnniversaryDate={setAnniversaryDate}
      showPicker={showAnniversaryPicker}
      setShowPicker={setShowAnniversaryPicker}
      onPrevious={() => setStep(2)}
      onNext={() => setStep(4)}
    />,
    <LocationStep
      key="5"
      location={location}
      setLocation={setLocation}
      timezone={timezone}
      setTimezone={setTimezone}
      onPrevious={() => setStep(3)}
      onFinish={() => handleFinish()}
      uploading={uploading}
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
