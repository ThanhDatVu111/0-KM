'use client';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Button from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_SIGN_URL = process.env.EXPO_PUBLIC_CLOUDINARY_SIGN_URL;

// ─── MediaItem type ──────────────────────────────────────────────────────────────────────────────────────────────
export type MediaItem = {
  uri: string;
  type: 'image' | 'video';
  thumbnail?: string | null; // only for videos if you generate a thumbnail
};

export interface EntryFormProps {
  /** Required: which book this entry belongs to */
  bookId: string;

  /** Optional: if editing, pass the existing entry’s ID here */
  entryId?: string;

  /** Initial values (for “edit”); if undefined, form starts blank. */
  initialTitle?: string;
  initialBody?: string;
  initialMedia?: MediaItem[];
  initialLocation?: string;
  initialCreatedAt?: string;

  /** True while the parent is saving; form’s “Done” button will disable if true */
  saving: boolean;

  onSubmit: (entryData: {
    id: string;
    book_id: string;
    title: string;
    body: string | null;
    location: { address: string } | null;
    pin: boolean;
    media_paths: string[];
    created_at?: string;
    updated_at?: string;
  }) => Promise<void>;
}

export default function EntryForm({
  bookId,
  entryId,
  initialTitle = '',
  initialBody = '',
  initialMedia = [],
  initialLocation = '',
  initialCreatedAt,
  saving,
  onSubmit,
}: EntryFormProps) {
  // ─── Form state ──────────────────────────────────────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState<string>(initialTitle);
  const [body, setBody] = useState<string>(initialBody);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>(initialMedia);
  const [locationAddress, setLocationAddress] = useState<string>(initialLocation);

  // For location modal
  const [tempAddress, setTempAddress] = useState<string>('');
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  const MAX_MEDIA = 16; // Maximum number of media items allowed

  const handlePickImage = async () => {
    if (selectedMedia.length >= MAX_MEDIA) {
      alert(`You can only select up to ${MAX_MEDIA} images.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access photos is required!');
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
      const remainingSlots = MAX_MEDIA - selectedMedia.length;
      const newAssets = result.assets.slice(0, remainingSlots);

      const newMedia = newAssets.map((asset) => ({
        uri: asset.uri,
        type: 'image' as const,
      }));

      setSelectedMedia((prev) => [...prev, ...newMedia]);
    }
  };
  // ─── Validation ─────────────────────────────────────────────────────────────────────────────────────────────────
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

  // ─── Format date ─────────────────────────────────────────────────────────────────────────────────────────────────
  const now = new Date();
  const formattedDate = initialCreatedAt
    ? new Date(initialCreatedAt).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : now.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

  // ─── Camera Pickers ────────────────────────────────────────────────────────────────────────────────────────────────
  const handleCameraPicker = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      alert('Permission to access camera is required.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
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

  // ─── Location Picker ──────────────────────────────────────────────────────────────────────────────────────────────
  const handleLocationPicker = async () => {
    setLocationLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission',
        'We need your permission to read your location. Please enable it in Settings.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLocationLoading(false) },
          {
            text: 'Open Settings',
            onPress: () => {
              setLocationLoading(false);
              Linking.openSettings();
            },
          },
        ],
      );
      return;
    }
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const [rev] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      let formatted = '';
      if (rev.name) formatted += rev.name;
      if (rev.street) formatted += (formatted ? ', ' : '') + rev.street;
      if (rev.city) formatted += (formatted ? ', ' : '') + rev.city;
      if (rev.region) formatted += (formatted ? ', ' : '') + rev.region;
      if (rev.postalCode) formatted += ' ' + rev.postalCode;
      if (rev.country) formatted += (formatted ? ', ' : '') + rev.country;

      setTempAddress(formatted); //use a temporary address for confirmation
      setShowLocationModal(true);
    } catch (err) {
      console.error('Reverse geocode error:', err);
      alert('Unable to get location. Try again.');
      setLocationLoading(false);
    }
  };

  const onSaveLocation = () => {
    setLocationAddress(tempAddress.trim());
    setShowLocationModal(false);
    setLocationLoading(false);
  };
  const onCancelLocation = () => {
    setTempAddress('');
    setLocationAddress('');
    setShowLocationModal(false);
    setLocationLoading(false);
  };

  // ─── When “Done” is pressed ────────────────────────────────────────────────────────────────────────────────────────
  const handleDonePress = async () => {
    if (!title.trim()) {
      alert('Title is required!');
      return;
    }

    try {
      const uploadedUrls = await Promise.all(selectedMedia.map((m) => uploadToCloudinary(m.uri)));
      const entryData: {
        id: string;
        book_id: string;
        title: string;
        body: string | null;
        location: { address: string } | null;
        pin: boolean;
        media_paths: string[];
        created_at?: string;
        updated_at?: string;
      } = {
        id: entryId || '', // if editing, entryId is set; if creating, parent will choose a new ID
        book_id: bookId,
        title: title.trim(),
        body: body.trim() || null,
        location: locationAddress ? { address: locationAddress } : null,
        pin: false,
        media_paths: uploadedUrls,
      };
      if (entryId) {
        entryData.updated_at = new Date().toISOString();
      } else {
        entryData.created_at = new Date().toISOString();
      }
      await onSubmit(entryData); // Send the entry data to the backend
    } catch (err: any) {
      console.error('Error uploading media or submitting entry:', err);
    }
  };

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* ─── Main Form ─── */}
        <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
          {/* ─── Title Input ─── */}
          <Text className="text-base font-medium text-gray-700 mb-1">Memory title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter memory title"
            className="border border-gray-300 rounded-md px-3 py-2 mb-4"
          />

          {/* ─── Read‐only Date ─── */}
          <Text className="text-sm text-gray-500 mb-6">{formattedDate}</Text>

          {/* ─── Body Input ─── */}
          <Text className="text-base font-medium text-gray-700 mb-1">
            Write a few words about your memory here
          </Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Start typing..."
            className="border border-gray-300 rounded-md px-3 py-2 mb-4 h-80 text-gray-800"
            multiline
          />

          {/* ─── Pickers Row ─── */}
          <View className="flex-row items-center mb-4">
            <Pressable onPress={handleCameraPicker} className="mr-6">
              <Ionicons name="camera-outline" size={28} color="#4B5563" />
            </Pressable>

            <Pressable onPress={handlePickImage} className="mr-6">
              <Ionicons name="image-outline" size={28} color="#4B5563" />
            </Pressable>

            <Pressable onPress={handleLocationPicker} className="mr-40" disabled={locationLoading}>
              {locationLoading ? (
                <ActivityIndicator size="small" color="#4B5563" />
              ) : (
                <Ionicons name="location-outline" size={28} color="#4B5563" />
              )}
            </Pressable>

            {/* “Done” button */}
            <View className="right-4 mt-2">
              <Button
                label={saving ? 'Saving…' : 'Done'}
                size="px-4 py-2"
                color="bg-accent"
                textClassName="text-white text-base font-medium text-center"
                onPress={handleDonePress}
                disabled={saving}
              />
            </View>
          </View>

          {/* ─── Show Selected Location ─── */}
          <View className="mb-4">
            <Text className="text-base font-medium text-gray-700">Selected Location:</Text>
            <Text className="text-sm text-gray-500">
              {locationAddress || 'No location selected'}
            </Text>
          </View>

          {/* ─── Location Confirmation Modal ─── */}
          <Modal visible={showLocationModal} transparent animationType="fade">
            <BlurView intensity={50} tint="dark" className="flex-1 justify-center items-center">
              <View className="bg-white p-6 rounded-md w-80 shadow-lg">
                <Text className="text-lg font-medium text-gray-700 mb-4">Confirm Location</Text>
                <Text className="text-sm text-gray-500 mb-6">{tempAddress}</Text>
                <View className="flex-row justify-between">
                  <Pressable
                    onPress={onCancelLocation}
                    className="bg-gray-300 py-2 px-4 rounded-md"
                  >
                    <Text className="text-gray-700 font-medium">Cancel</Text>
                  </Pressable>
                  <Pressable onPress={onSaveLocation} className="bg-accent py-2 px-4 rounded-md">
                    <Text className="text-white font-medium">Save</Text>
                  </Pressable>
                </View>
              </View>
            </BlurView>
          </Modal>

          {/* ─── Media Thumbnails ─── */}
          {selectedMedia.length > 0 && (
            <View className="mt-4">
              <Text className="text-base font-medium text-gray-700 mb-2">
                Selected Photos & Videos:
              </Text>
              <View className="flex-row flex-wrap justify-start">
                {selectedMedia.map((item, index) => (
                  <View
                    key={index}
                    className="relative w-24 h-24 m-1 border border-gray-300 overflow-hidden rounded-2xl"
                  >
                    <Image
                      source={{ uri: item.uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {/* ❌ Remove Button */}
                    <Pressable
                      onPress={() => setSelectedMedia((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full items-center justify-center z-10"
                    >
                      <Text className="text-white text-xs font-bold">✕</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
