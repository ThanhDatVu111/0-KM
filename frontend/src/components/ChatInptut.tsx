import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_SIGN_URL = process.env.EXPO_PUBLIC_CLOUDINARY_SIGN_URL;

export type MediaItem = {
    uri: string;
    type: 'image' | 'video';
    thumbnail?: string | null; // only for video
}

export interface ChatInputProps {
    selectedImages: string[];
    setSelectedImages: (images: string[]) => void;
    message: string;
    setMessage: (message: string) => void;
    onMediaPress: () => void;
    onRecordPress: () => void;
}

export default function ChatInput({ selectedImages, setSelectedImages, message, setMessage, onImagePress, onRecordPress }: ChatInputProps) {
    return (
      <View className="bg-linear-to-r/increasing from-[#FFC6F9]-100 to-[#6536DA]-100 border-t border-gray-200 px-3 py-2 flex-row items-center overflow-scroll container mx-auto">
        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <View className="absolute bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-2">
            <View className="flex-row flex-wrap gap-2">
              {selectedImages.map((imageUri, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri: imageUri }}
                    className="w-16 h-16 rounded-lg"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setSelectedImages((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 justify-center items-center"
                  >
                    <Text className="text-white text-xs">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="flex-1 flex-row bg-white border border-accent px-4 py-2 mr-2 rounded-lg">
          {/* Image Button */}
          <TouchableOpacity onPress={onImagePress} className="mt-0.5">
            <FontAwesome name="camera" size={24} color="#F5829B" />
          </TouchableOpacity>
          {/* Text Input : Messages */}
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            multiline
            className=" text-base p-1 items-center px-4 font-poppins-light mr-5"
            style={{ maxHeight: 100 }}
            placeholderTextColor="#F5829B"
          />
          {/* Voice Button */}
          {!message && (
            <TouchableOpacity onPress={onRecordPress} className="mt-2.5 absolute right-4">
              <MaterialIcons name="keyboard-voice" size={24} color="#F5829B" />
            </TouchableOpacity>
          )}
        </View>
        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSendMessage}
          className="w-12 h-12 rounded-full bg-accent justify-center items-center"
        >
          <Ionicons name="send" size={22} color="white" />
        </TouchableOpacity>
      </View>
    );
}
