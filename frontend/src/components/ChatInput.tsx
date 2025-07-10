import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Pressable } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { sendMessage } from '@/apis/chat';
import { useSocket } from '../utils/SocketProvider';
import uuid from 'react-native-uuid';
import { useChatSocket } from '@/hooks/useSocketChat';
import { uploadToCloudinary } from '@/utils/cloudinaryUpload';

export type MediaItem = {
  uri: string;
  cloudinaryUrl?: string;
  type: string;
};

export interface ChatInputProps {
  room_id: string | null;
  sender_id: string | null;
  message_id: string; // Fetched using Socket ID
  initialMedia?: MediaItem[]; // Thumbnails of selected media
  saving?: boolean;
  // socket: typeof Socket | null;
}

export default function ChatInput({ room_id, sender_id }: ChatInputProps) {
  const [content, setContent] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const socket = useSocket();
  const { handleSendMessage } = useChatSocket({
    room_id: room_id!,
    user_id: sender_id!,
  });

  const MAX_MEDIA = 10; // Max number
  // const MAX_WORDS

  // Camera - Take Photo
  const handleTakePhoto = async () => {
    if (selectedMedia.length >= MAX_MEDIA) {
      alert(`Exceeded ${MAX_MEDIA} media items.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newMedia = {
        uri: result.assets[0].uri,
        type: 'image' as const,
      };

      setSelectedMedia((prev) => [...prev, newMedia]);
    }
  };

  // Gallery - Pick Image from Library
  const handlePickImage = async () => {
    if (selectedMedia.length >= MAX_MEDIA) {
      alert(`Exceeded ${MAX_MEDIA} media items.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access photo library is required!');
      return;
    }

    const remainingSlots = MAX_MEDIA - selectedMedia.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets.length > 0) {
      const actualRemainingSlots = MAX_MEDIA - selectedMedia.length;
      const newAssets = result.assets.slice(0, actualRemainingSlots);

      const newMedia = newAssets.map((asset) => ({
        uri: asset.uri,
        type: 'image' as const,
      }));

      setSelectedMedia((prev) => [...prev, ...newMedia]);
    }
  };

  const handleSendPress = async () => {
    if (!content.trim() && !selectedMedia.length) return;
    if (!socket) return;
    console.log('ChatInput received socket: ', socket.id);

    setSaving(true);

    try {
      const updatedMedia = await Promise.all(
        selectedMedia.map(async (media) => {
          if (media.cloudinaryUrl) return media;
          const url = await uploadToCloudinary(media.uri);
          return { ...media, cloudinaryUrl: url };
        }),
      );
      setSelectedMedia(updatedMedia); // update state with new cloudinaryUrls

      const messageData: {
        room_id: string;
        message_id: string;
        content?: string | null;
        created_at: string;
        sender_id: string;
        media_paths?: string[];
        is_sent: boolean;
        is_read?: boolean;
        is_edited?: boolean;
        reaction?: string;
      } = {
        message_id: uuid.v4(),
        room_id: room_id!,
        sender_id: sender_id!,
        content: content.trim(),
        media_paths: updatedMedia.map((item) => item.cloudinaryUrl!).filter(Boolean),
        created_at: new Date().toISOString(),
        is_sent: true,
        is_read: false,
        is_edited: false,
        reaction: '',
      };
      handleSendMessage(messageData);
      setContent('');
      setSelectedMedia([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setSaving(false);
  };

  return (
    <View className="px-3 py-2">
      {/* Media Picker - Simple Icons */}
      {showMediaPicker && (
        <View className="flex-row justify-center mb-2 space-x-4 gap-3">
          {/* Camera Icon */}
          <TouchableOpacity
            onPress={() => {
              handleTakePhoto();
              setShowMediaPicker(false);
            }}
            style={{
              backgroundColor: '#FFE4EC',
              borderWidth: 2,
              borderColor: '#220E6D',
              borderRadius: 4,
              width: 48,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <FontAwesome name="camera" size={24} color="#F24187" />
          </TouchableOpacity>

          {/* Gallery Icon */}
          <TouchableOpacity
            onPress={() => {
              handlePickImage();
              setShowMediaPicker(false);
            }}
            style={{
              backgroundColor: '#FFE4EC',
              borderWidth: 2,
              borderColor: '#220E6D',
              borderRadius: 4,
              width: 48,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <Ionicons name="images" size={24} color="#F24187" />
          </TouchableOpacity>
        </View>
      )}

      {/* Media Preview */}
      {selectedMedia.length > 0 && (
        <View
          className="mb-3 p-3"
          style={{
            backgroundColor: '#FFF0F5',
            borderWidth: 2,
            borderColor: '#B07DE9',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 1, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 0,
          }}
        >
          <View className="flex-row flex-wrap gap-2">
            {selectedMedia.map((item, index) => (
              <View key={index} className="relative">
                <Image
                  source={{ uri: item.uri }}
                  className="w-16 h-16"
                  style={{
                    borderWidth: 2,
                    borderColor: '#F24187',
                    borderRadius: 4,
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setSelectedMedia((prev) => prev.filter((_, i) => i !== index))}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: '#F24187',
                    borderWidth: 1,
                    borderColor: '#220E6D',
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Main Input Container */}
      <View className="flex-row items-end" style={{ gap: 8 }}>
        {/* Media Toggle Button */}
        <TouchableOpacity
          onPress={() => setShowMediaPicker(!showMediaPicker)}
          style={{
            backgroundColor: showMediaPicker ? '#F24187' : '#FFE4EC',
            borderWidth: 2,
            borderColor: '#220E6D',
            borderRadius: 4,
            width: 48,
            height: 48,
            marginBottom: 10,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
        >
          <MaterialIcons
            name={showMediaPicker ? 'keyboard-arrow-up' : 'add'}
            size={24}
            color={showMediaPicker ? '#FFF' : '#F24187'}
          />
        </TouchableOpacity>

        {/* Text Input Container */}
        <View
          className="flex-1 flex-row items-center"
          style={{
            backgroundColor: '#FFF0F5',
            borderWidth: 3,
            borderColor: '#B07DE9',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOffset: { width: 1, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 0,
            elevation: 2,
            minHeight: 48,
          }}
        >
          {/* Text Input */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Type a message..."
            multiline
            className="flex-1"
            style={{
              maxHeight: 120,
              fontSize: 16,
              color: '#220E6D',
              lineHeight: 22,
              paddingVertical: 8,
              minHeight: 24,
              fontFamily: 'PixelifySans',
            }}
            placeholderTextColor="#B07DE9"
          />

          {/* Voice Button */}
          {!content && (
            <TouchableOpacity
              onPress={() => {}}
              className="p-2 ml-2"
              style={{
                backgroundColor: '#FFE4EC',
                borderWidth: 1,
                borderColor: '#220E6D',
                borderRadius: 4,
                shadowColor: '#000',
                shadowOffset: { width: 1, height: 1 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <MaterialIcons name="keyboard-voice" size={18} color="#F24187" />
            </TouchableOpacity>
          )}
        </View>

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSendPress}
          disabled={!content.trim() && !selectedMedia.length}
          style={{
            backgroundColor: !content.trim() && !selectedMedia.length ? '#D1D5DB' : '#F24187',
            borderWidth: 2,
            borderColor: '#220E6D',
            borderRadius: 4,
            width: 48,
            height: 48,
            marginBottom: 10,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
        >
          <MaterialCommunityIcons
            name="send"
            size={22}
            color={!content.trim() && !selectedMedia.length ? '#9CA3AF' : '#FFF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
