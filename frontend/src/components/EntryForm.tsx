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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Button from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as VideoThumbnails from 'expo-video-thumbnails';

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
    media: { uri: string; type: 'image' | 'video' }[];
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

  const MAX_MEDIA = 10;

  // Format date (read‐only). If editing, show initialCreatedAt; if creating, show “now.”
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

  //
  // ─── Media Pickers ────────────────────────────────────────────────────────────────────────────────────────────────
  //
  const handleCameraPicker = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      alert('Permission to access camera is required.');
      return;
    }
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
  };

  const handleImagePicker = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      alert('Permission to access media library is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const newItems = result.assets.map((asset) => ({
        uri: asset.uri,
        type: 'image' as const,
      }));
      setSelectedMedia((prev) => {
        const combined = [...prev, ...newItems];
        if (combined.length > MAX_MEDIA) {
          alert(`You can only select up to ${MAX_MEDIA} items.`);
          return combined.slice(0, MAX_MEDIA);
        }
        return combined;
      });
    }
  };

  const handleVideoPicker = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      alert('Permission to access media library is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      let thumbnailUri: string | null = null;
      try {
        const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(uri, {
          time: 1000,
        });
        thumbnailUri = thumb;
      } catch (err) {
        console.error('Error generating video thumbnail:', err);
      }
      setSelectedMedia((prev) => {
        if (prev.length >= MAX_MEDIA) {
          alert(`You can only select up to ${MAX_MEDIA} items.`);
          return prev;
        }
        return [...prev, { uri, type: 'video', thumbnail: thumbnailUri }];
      });
    }
  };

  //
  // ─── Location Picker ──────────────────────────────────────────────────────────────────────────────────────────────
  //
  const handleLocationPicker = async () => {
    setLocationLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location is required.');
      setLocationLoading(false);
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

      setTempAddress(formatted);
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
    setShowLocationModal(false);
    setLocationLoading(false);
  };

  //
  // ─── When “Done” is pressed ────────────────────────────────────────────────────────────────────────────────────────
  //
  const handleDonePress = async () => {
    if (!title.trim()) {
      alert('Title is required!');
      return;
    }

    // Build the payload
    const entryData: {
      id: string;
      book_id: string;
      title: string;
      body: string | null;
      location: { address: string } | null;
      pin: boolean;
      media: { uri: string; type: 'image' | 'video' }[];
      created_at?: string;
      updated_at?: string;
    } = {
      id: entryId || '', // if editing, entryId is set; if creating, parent will choose a new ID
      book_id: bookId,
      title: title.trim(),
      body: body.trim() || null,
      location: locationAddress ? { address: locationAddress } : null,
      pin: false,
      media: selectedMedia.map((item) => ({ uri: item.uri, type: item.type })),
    };

    if (entryId) {
      entryData.updated_at = new Date().toISOString();
      entryData.id = entryId;
    } else {
      entryData.created_at = new Date().toISOString();
    }

    try {
      await onSubmit(entryData);
    } catch (err: any) {
      console.error('EntryForm onSubmit error:', err);
    }
  };

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
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

            <Pressable onPress={handleImagePicker} className="mr-6">
              <Ionicons name="image-outline" size={28} color="#4B5563" />
            </Pressable>

            <Pressable onPress={handleVideoPicker} className="mr-6">
              <Ionicons name="videocam-outline" size={28} color="#4B5563" />
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
                {selectedMedia.slice(0, 3).map((item, index) => (
                  <View
                    key={index}
                    className="w-24 h-24 m-1 border border-gray-300 overflow-hidden rounded-2xl"
                  >
                    <Image
                      source={{ uri: item.uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {item.type === 'video' && (
                      <View className="absolute bottom-1 right-1 bg-opacity-50 rounded-2xl p-1 overflow-hidden">
                        <BlurView
                          intensity={50}
                          tint="default"
                          className="absolute inset-0 rounded-full"
                        />
                        <Ionicons
                          name="play"
                          size={16}
                          color="#fff"
                          className="absolute inset-0 flex items-center justify-center"
                        />
                      </View>
                    )}
                  </View>
                ))}

                {selectedMedia.length > 3 && (
                  <View className="relative w-24 h-24 m-1 border border-gray-300 rounded-2xl overflow-hidden">
                    <Image
                      source={{ uri: selectedMedia[3].uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <BlurView intensity={10} tint="default" className="absolute inset-0" />
                    <View className="absolute inset-0 flex items-center justify-center">
                      <Text className="text-white font-semibold text-lg">
                        +{selectedMedia.length - 3}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}