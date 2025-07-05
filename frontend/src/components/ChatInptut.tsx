import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { sendMessage } from '@/apis/chat';
import { useSocket } from 'utils/SocketProvider';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_SIGN_URL = process.env.EXPO_PUBLIC_CLOUDINARY_SIGN_URL;

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
  const socket = useSocket();

  const MAX_MEDIA = 10; // Max number
  // const MAX_WORDS

  // Pick Image
  const handlePickImage = async () => {
    if (selectedMedia.length >= MAX_MEDIA) {
      alert(`Exceeded ${MAX_MEDIA} media items.`);

      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access photos is required!');
      return;
    }

    const remainingSlots = MAX_MEDIA - selectedMedia.length;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets.length > 0) {
      const remmainingSlots = MAX_MEDIA - selectedMedia.length;
      const newAssets = result.assets.slice(0, remainingSlots);

      const newMedia = newAssets.map((asset) => ({
        uri: asset.uri,
        type: 'image' as const,
      }));

      setSelectedMedia((prev) => [...prev, ...newMedia]);
    }
  };

  // Validation
  async function uploadToCloudinary(uri: string): Promise<string> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_SIGN_URL) {
      throw new Error(
        'Define EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME, EXPO_PUBLIC_CLOUDINARY_API_KEY & EXPO_PUBLIC_CLOUDINARY_SIGN_URL in .env',
      );
    }
    // 1) Get the signature + timestamp
    let signature: string, timestamp: number;
    try {
      const sigRes = await fetch(CLOUDINARY_SIGN_URL);
      const sigJson = await sigRes.json();
      signature = sigJson.signature;
      timestamp = sigJson.timestamp;
    } catch (err: any) {
      console.error('❌ Error fetching signature', err);
      throw err;
    }

    // 2) Build the multipart/form-data
    const form = new FormData();
    form.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    form.append('api_key', CLOUDINARY_API_KEY);
    form.append('timestamp', timestamp.toString());
    form.append('signature', signature);

    // 3) Upload to Cloudinary
    let uploadRes: Response, uploadJson: any;
    try {
      uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: form },
      );
      uploadJson = await uploadRes.json();
    } catch (err: any) {
      console.error('❌ Network error uploading to Cloudinary', err);
      throw err;
    }
    if (!uploadRes.ok) {
      console.error('❌ Cloudinary returned an error', uploadJson.error);
      throw new Error(uploadJson.error?.message || 'Cloudinary upload failed');
    }

    console.log('✅ Image uploaded to Cloudinary secure_url =', uploadJson.secure_url);
    return uploadJson.secure_url;
  }

  // Camera Picker
  const handleCameraPicker = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      alert('Permission to access camera is required.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setSelectedMedia((prev) => {
          if (prev.length + 1 > MAX_MEDIA) {
            alert(`You can only select up to ${MAX_MEDIA} items.`);
            return prev;
          }
          return [...prev, { uri, type: 'image' }];
        });
      }
    } catch (error) {
      console.error('Error during camera picker:', error);
      alert('An error occurred while accessing the camera.');
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
        message_id: `${Date.now()}-${sender_id}`,
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
      console.log('Sending: ', messageData);
      socket.emit('send-message', messageData);
      console.log('Frontend: emit send-message');
      // await sendMessage(messageData);
      setContent('');
      setSelectedMedia([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setSaving(false);
  };

  return (
    <View className="bg-linear-to-r/increasing from-[#FFC6F9]-100 to-[#6536DA]-100 border-t border-gray-200 px-3 py-2 flex-row items-center overflow-scroll container mx-auto">
      {/* Media Thumbnail */}
      {selectedMedia.length > 0 && (
        <View className="absolute bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-2">
          <View className="flex-row flex-wrap gap-2">
            {selectedMedia.map((item, index) => (
              <View key={index} className="relative">
                <Image
                  source={{ uri: item.uri }}
                  className="w-16 h-16 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setSelectedMedia((prev) => prev.filter((_, i) => i !== index))}
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
        <TouchableOpacity onPress={handleCameraPicker} className="mt-0.5">
          <FontAwesome name="camera" size={24} color="#F5829B" />
        </TouchableOpacity>
        {/* Text Input : Messages */}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Type a message..."
          multiline
          className=" text-base p-1 items-center px-4 font-poppins-light mr-5"
          style={{ maxHeight: 100 }}
          placeholderTextColor="#F5829B"
        />
        {/* Voice Button */}
        {!content && (
          <TouchableOpacity onPress={() => {}} className="mt-2.5 absolute right-4">
            <MaterialIcons name="keyboard-voice" size={24} color="#F5829B" />
          </TouchableOpacity>
        )}
      </View>
      {/* Send Button */}
      <TouchableOpacity
        onPress={handleSendPress}
        className="w-12 h-12 rounded-full bg-accent justify-center items-center"
      >
        <Ionicons name="send" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
}
