import { View, Text, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';

export default function PhotoUploadScreen() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  return (
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
}
