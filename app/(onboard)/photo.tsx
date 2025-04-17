import { View, Text, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

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
    <View className="flex-1 justify-center items-center bg-white px-6">
      <Text className="text-xl font-bold mb-4">Upload your profile picture</Text>

      {photo ? (
        <Image source={{ uri: photo }} className="w-32 h-32 rounded-full mb-4" />
      ) : (
        <TouchableOpacity
          onPress={pickImage}
          className="border border-gray-400 px-6 py-3 rounded-lg mb-4"
        >
          <Text className="text-base">Choose Photo</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => router.replace('./page')} // Replace with your main app screen
        className="bg-accent py-3 rounded-lg w-full items-center"
      >
        <Text className="text-white text-base">Finish</Text>
      </TouchableOpacity>
    </View>
  );
}
