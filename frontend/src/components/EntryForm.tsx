'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import * as MediaLibrary from 'expo-media-library';
import { FlatList } from 'react-native';

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
  const [allImages, setAllImages] = useState<MediaLibrary.Asset[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const loadingRef = useRef(false);

  // For location modal
  const [tempAddress, setTempAddress] = useState<string>('');
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [initialFetchComplete, setInitialFetchComplete] = useState(false);

  const MAX_MEDIA = 15;
  const PAGE_SIZE = 100;

  const loadMoreImages = async () => {
    if (!hasNextPage || loadingRef.current) return;

    // Prevent multiple loads at once
    loadingRef.current = true;
    setGalleryLoading(true);

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Need photo permissions.');
      setShowGallery(false);
      setGalleryLoading(false);
      loadingRef.current = false;
      return;
    }

    // fetch a page, starting after whatever cursor we left off
    const res = await MediaLibrary.getAssetsAsync({
      first: PAGE_SIZE,
      after: endCursor ?? undefined, 
      mediaType: ['photo'],
      sortBy: ['creationTime'],
    });

    // convert ph:// to file://
    const newAssets = await Promise.all(
      res.assets.map(async (asset) => {
        const info = await MediaLibrary.getAssetInfoAsync(asset.id);
        return { ...asset, uri: info.localUri ?? asset.uri };
      }),
    );

    setAllImages((prev) => [...prev, ...newAssets]);
    setEndCursor(res.endCursor);
    setHasNextPage(res.hasNextPage); //if res is empty, hasNextPage will be false
    setInitialFetchComplete(true);
    setGalleryLoading(false);
    loadingRef.current = false;
  };

  useEffect(() => {
    if (!showGallery) return;

    // Reset state
    setAllImages([]);
    setEndCursor(null);
    setHasNextPage(true);
    setInitialFetchComplete(false); // Reset fetch state

    // Load the first page of images
    loadMoreImages();
  }, [showGallery]);

  const toggleMedia = (asset: MediaLibrary.Asset) => {
    setSelectedMedia((prev) => {
      const exists = prev.some((m) => m.uri === asset.uri);
      if (exists) {
        // remove
        return prev.filter((m) => m.uri !== asset.uri);
      }
      // add (with MAX_MEDIA guard)
      if (prev.length >= MAX_MEDIA) {
        alert(`You can only select up to ${MAX_MEDIA} items.`);
        return prev;
      }
      return [...prev, { uri: asset.uri, type: 'image' }];
    });
  };

  const handleScroll = useCallback(
    ({ nativeEvent }: { nativeEvent: any }) => {
      const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom < layoutMeasurement.height && !loadingRef.current) {
        loadMoreImages();
      }
    },
    [loadMoreImages],
  );

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

  // ─── Media Pickers ────────────────────────────────────────────────────────────────────────────────────────────────
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
      // Build the payload
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
        media_paths: selectedMedia.map((media) => media.uri), 
      };

      if (entryId) {
        entryData.updated_at = new Date().toISOString();
      } else {
        entryData.created_at = new Date().toISOString();
      }

      await onSubmit(entryData); // Send the entry data to the backend
    } catch (err: any) {
      console.error('Error uploading media or submitting entry:', err);
      alert('Failed to save entry. Please try again.');
    }
  };

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Modal
          visible={showGallery && initialFetchComplete}
          transparent
          presentationStyle="overFullScreen"
          animationType="fade"
        >
          {/* 1) Full-screen blur overlay */}
          <BlurView intensity={50} tint="light" className="absolute inset-0" />

          {/* 2) Centered popup container */}
          <View className="flex-1 justify-center items-center">
            <View className="w-11/12 h-3/6 bg-white rounded-lg p-4 shadow-lg">
              {/* 3) Even 4-column grid */}
              <FlatList
                className="flex-1" //Fill the remaining vertical space of your parent container, and be that height.”
                data={allImages}
                keyExtractor={(img) => img.id}
                numColumns={4}
                columnWrapperStyle={{ justifyContent: 'flex-start' }} // left align
                contentContainerStyle={{ paddingVertical: 10 }} // vertical padding
                onScroll={handleScroll}
                ListFooterComponent={galleryLoading ? <ActivityIndicator /> : null}
                renderItem={({ item: img }) => {
                  const isSel = selectedMedia.some((m) => m.uri === img.uri);
                  return (
                    <Pressable onPress={() => toggleMedia(img)} className="basis-1/4 p-1">
                      <Image
                        source={{ uri: img.uri }}
                        className={`w-full aspect-square rounded-md ${isSel ? 'opacity-50' : ''}`}
                      />
                      {isSel && (
                        <View className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
                          <Text>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                }}
              />

              {/* 4) Done button */}
              <Button
                label="Done"
                onPress={() => setShowGallery(false)}
                size="px-4 py-2 mt-4"
                color="bg-accent"
                textClassName="text-white text-center"
              />
            </View>
          </View>
        </Modal>
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

            <Pressable
              onPress={() => setShowGallery(true)}
              className="mr-6"
              disabled={galleryLoading}
            >
              {galleryLoading ? (
                <ActivityIndicator size="small" color="#4B5563" />
              ) : (
                <Ionicons name="image-outline" size={28} color="#4B5563" />
              )}
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
