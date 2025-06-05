// app/(tabs)/library/[bookId]/new.tsx
'use client';

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Button from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { CreateEntries } from '@/apis/entries';
import uuid from 'react-native-uuid';

export default function NewEntryScreen() {
  const { bookId: rawId } = useLocalSearchParams();
  const bookId = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  type MediaItem = {
    uri: string;
    type: 'image' | 'video';
  };

  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const MAX_MEDIA = 10;

  // ─── Location state ───
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [tempAddress, setTempAddress] = useState<string>('');
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  // 3) Compute a formatted date string for display (optional read-only)
  const now = new Date();
  const formattedDate = now.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleCameraPicker = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access the camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log('Captured image:', result.assets[0].uri);
      setSelectedMedia((prev) => [...prev, { uri: result.assets[0].uri, type: 'image' }]); // Add the captured image to the state
    }
  };

  const handleImagePicker = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      alert('Permission to access the media library is required!');
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
      alert('Permission to access the media library is required!');
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
      setSelectedMedia((prev) => {
        if (prev.length >= MAX_MEDIA) {
          alert(`You can only select up to ${MAX_MEDIA} items.`);
          return prev;
        }
        return [...prev, { uri, type: 'video' }];
      });
    }
  };

  const handleLocationPicker = async () => {
    setLocationLoading(true);

    // Ask the user for foreground permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Location permission is required!');
      setLocationLoading(false);
      return;
    }

    try {
      // 1a) Get the current GPS position
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      // 1b) Reverse-geocode to get an array of addresses
      const [rev] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      // Build a single string out of the returned address object
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
      console.error('Error fetching/reverse-geocoding location:', err);
      alert('Could not determine your location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // ─── 2) When user taps “Save” inside the modal overlay ───
  const onSaveLocation = () => {
    setLocationAddress(tempAddress.trim());
    setShowLocationModal(false);
  };

  // ─── 3) When user taps “Cancel” inside the modal overlay ───
  const onCancelLocation = () => {
    // Don’t change `locationAddress`; just close the modal
    setLocationAddress('');
    setShowLocationModal(false);
  };

  // ─── 4) Save the entry to the database ───
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title is required!');
      return;
    }
    setSaving(true);
    try {
      const entryData = {
        id : uuid.v4(),
        book_id: bookId, 
        title: title.trim(),
        body: body.trim() || null, 
        location: locationAddress
          ? { address: locationAddress } 
          : null,
        pin: false,
        media: selectedMedia.map((item) => ({
          uri: item.uri,
          type: item.type,
        })), 
        created_at: new Date().toISOString(),
      };

      const createdEntry = await CreateEntries(entryData); // Call the API
      console.log('Entry created successfully:', createdEntry);

      alert('Entry saved successfully!');
      router.back(); // Navigate back to the previous screen
    } catch (err: any) {
      console.error('Error saving entry:', err.message);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
    router.push(`/library/${bookId}/page`); // Redirect to the book's entries page
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* ───── HEADER ───── */}
        <View className="h-12 flex-row items-center px-4">
          <Pressable onPress={() => router.back()} className="justify-center">
            <Ionicons name="chevron-back" size={24} color="#000" />
          </Pressable>

          <View className="flex-1 items-center">
            <Text className="text-lg font-semibold">Travel story</Text>
          </View>

          {/* Invisible spacer so “Travel story” stays centered */}
          <View style={{ width: 24 }} />
        </View>

        {/* ───── FORM ───── */}
        <View className="flex-1 px-6 pt-4">
          {/* Memory Title Label */}
          <Text className="text-base font-medium text-gray-700 mb-1">Memory title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter memory title"
            className="border border-gray-300 rounded-md px-3 py-2 mb-4"
          />

          {/* Date Label (read-only) */}
          <Text className="text-sm text-gray-500 mb-6">{formattedDate}</Text>

          {/* Body Label */}
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
          <View className="flex-row items-center mb-4">
            {/* Camera icon */}
            <Pressable onPress={handleCameraPicker} className="mr-6">
              <Ionicons name="camera-outline" size={28} color="#4B5563" />
            </Pressable>

            {/* Image picker icon */}
            <Pressable onPress={handleImagePicker} className="mr-6">
              <Ionicons name="image-outline" size={28} color="#4B5563" />
            </Pressable>

            {/* Video picker icon */}
            <Pressable onPress={handleVideoPicker} className="mr-6">
              <Ionicons name="videocam-outline" size={28} color="#4B5563" />
            </Pressable>

            {/* Location icon */}
            <Pressable onPress={handleLocationPicker} className="mr-40" disabled={locationLoading}>
              {locationLoading ? (
                <ActivityIndicator size="small" color="#4B5563" />
              ) : (
                <Ionicons name="location-outline" size={28} color="#4B5563" />
              )}
            </Pressable>

            {/* Done button, absolutely positioned */}
            <View className="right-4 mt-2">
              <Button
                label={saving ? 'Saving…' : 'Done   '}
                size="px-4 py-2"
                color="bg-accent"
                textClassName="text-white text-base font-medium text-center"
                onPress={handleSave}
                disabled={saving}
              />
            </View>
          </View>

          {/* Display Selected Location */}
          {locationAddress ? (
            <View>
              <Text className="text-base font-medium text-gray-700">Selected Location:</Text>
              <Text className="text-sm text-gray-500">{locationAddress}</Text>
            </View>
          ) : (
            <View>
              <Text className="text-base font-medium text-gray-700">Selected Location:</Text>
              <Text className="text-sm text-gray-500">No location selected</Text>
            </View>
          )}

          <Modal visible={showLocationModal} transparent={true} animationType="fade">
            {/* Blurred background */}
            <BlurView intensity={50} tint="dark" className="flex-1 justify-center items-center">
              {/* Popup content */}
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

          {/* ───── SELECTED MEDIA GRID ───── */}
          {selectedMedia.length > 0 && (
            <View className="mt-4">
              <Text className="text-base font-medium text-gray-700 mb-2">
                Selected Photos & Videos:
              </Text>
              <View className="flex-row flex-wrap justify-start">
                {/* Show up to the first 3 items */}
                {selectedMedia.slice(0, 3).map((item, index) => (
                  <View
                    key={index}
                    className="w-24 h-24 m-1 border border-gray-300 rounded-md overflow-hidden"
                  >
                    <Image
                      source={{ uri: item.uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {item.type === 'video' && (
                      <View className="absolute bottom-1 right-1 bg-black bg-opacity-50 rounded-full p-1">
                        <Ionicons name="play" size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                ))}
                {/* If more than 3, show “+N” tile */}
                {selectedMedia.length > 3 && (
                  <View
                    key="remaining"
                    className="w-24 h-24 m-1 border border-gray-300 rounded-md overflow-hidden relative"
                  >
                    <Image
                      source={{ uri: selectedMedia[3].uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-opacity-50 flex justify-center items-center">
                      <Text className="text-2xl font-semibold text-white">
                        +{selectedMedia.length - 3}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
