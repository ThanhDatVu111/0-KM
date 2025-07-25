'use client';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import images from '@/constants/images';
import icons from '@/constants/icons';
import { router } from 'expo-router';
import MapPickerWebView from './MapPickerWebView';
import { Video, ResizeMode } from 'expo-av';
import { uploadToCloudinary } from '@/utils/cloudinaryUpload';

// ─── MediaItem type ──────────────────────────────────────────────────────────────────────────────────────────────
export type MediaItem = {
  uri: string;
  cloudinaryUrl?: string;
  type: 'image' | 'video';
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
  initialUpdatedAt?: string;

  saving?: boolean;

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
  initialUpdatedAt,
  onSubmit,
}: EntryFormProps) {
  // ─── Form state ──────────────────────────────────────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState<string>(initialTitle);
  const [body, setBody] = useState<string>(initialBody);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>(initialMedia);
  const [locationAddress, setLocationAddress] = useState<string>(initialLocation);
  const [saving, setSaving] = useState(false);
  const [showWebPicker, setShowWebPicker] = useState(false);
  const [_, setPickedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [bgLoaded, setBgLoaded] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (bgLoaded) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400, // Adjust for smoother/slower fade
        useNativeDriver: true,
      }).start();
    }
  }, [bgLoaded]);

  const MAX_MEDIA = 32; // Maximum number of media items allowed
  const MAX_WORDS = 500;

  // ─── Pick Image ─────────────────────────────────────────────────────────────────────────────────────────────────
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
      const newAssets = result.assets.slice(0, remainingSlots);
      const newMedia = newAssets.map((asset) => ({ uri: asset.uri, type: 'image' as const }));
      setSelectedMedia((prev) => [...prev, ...newMedia]);
    }
  };

  // ─── Camera Picker ────────────────────────────────────────────────────────────────────────────────────────────────
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

  // ─── Pick Video ─────────────────────────────────────────────────────────────────────────────────────────────────
  const handlePickVideo = async () => {
    if (selectedMedia.length >= MAX_MEDIA) {
      alert(`You can only select up to ${MAX_MEDIA} items.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access videos is required!');
      return;
    }
    const remainingSlots = MAX_MEDIA - selectedMedia.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: remainingSlots,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newAssets = result.assets.slice(0, remainingSlots);
      const newMedia = newAssets.map((asset) => ({ uri: asset.uri, type: 'video' as const }));
      setSelectedMedia((prev) => [...prev, ...newMedia]);
    }
  };

  // ─── Date/word helpers ───────────────────────────────────────────────────────────────────────────────────────────
  const now = new Date();
  let footerDateLabel = '';
  let footerDateValue = '';
  if (initialUpdatedAt && initialUpdatedAt !== initialCreatedAt) {
    footerDateLabel = 'Updated at';
    footerDateValue = new Date(initialUpdatedAt ?? '').toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } else {
    footerDateLabel = 'Created at';
    footerDateValue = new Date(initialCreatedAt ?? '').toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  const countWords = (text: string) =>
    text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

  // ─── When “Done” is pressed ────────────────────────────────────────────────────────────────────────────────────────
  const handleDonePress = async () => {
    if (!title.trim()) {
      alert('Title is required!');
      return;
    }
    setSaving(true);
    try {
      const updatedMedia = await Promise.all(
        selectedMedia.map(async (media) => {
          if (media.cloudinaryUrl) return media;
          const url = await uploadToCloudinary(media.uri, media.type);
          return { ...media, cloudinaryUrl: url };
        }),
      );
      setSelectedMedia(updatedMedia);
      const entryData = {
        id: entryId || '',
        book_id: bookId,
        title: title.trim(),
        body: body.trim() || null,
        location: locationAddress ? { address: locationAddress } : null,
        pin: false,
        media_paths: updatedMedia.map((m) => m.cloudinaryUrl!).filter(Boolean),
        ...(entryId
          ? { updated_at: new Date().toISOString() }
          : { created_at: new Date().toISOString() }),
      };
      await onSubmit(entryData);
    } catch (err: any) {
      console.error('Error uploading media or submitting entry:', err);
      alert('Failed to upload media. Please try again.');
    }
    setSaving(false);
  };

  type FooterRowProps = {
    icon: any;
    text: string;
    textColor?: string;
    onClear?: () => void;
  };

  function FooterRow({ icon, text, textColor = '#666', onClear }: FooterRowProps) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 4,
          gap: 6,
        }}
      >
        <Image
          source={icon}
          style={{ width: 18, height: 18, marginRight: 4 }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontFamily: 'PixelifySans',
            fontSize: 13,
            color: textColor,
            flex: 1,
            flexWrap: 'wrap',
            lineHeight: 18,
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {text}
        </Text>
        {onClear && (
          <Pressable
            onPress={onClear}
            style={{
              marginLeft: 8,
              padding: 2,
              borderRadius: 10,
              backgroundColor: '#eee',
            }}
          >
            <Text style={{ color: '#888', fontSize: 14 }}>✕</Text>
          </Pressable>
        )}
      </View>
    );
  }

  function setMapPickerVisible(visible: boolean): void {
    setShowWebPicker(visible);
  }

  return (
    <View className="flex-1">
      <ImageBackground
        source={images.entryFormBg}
        resizeMode={ResizeMode.COVER}
        className="flex-1"
        onLoadEnd={() => setBgLoaded(true)}
      >
        {!bgLoaded ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fff',
            }}
          >
            <ActivityIndicator size="large" color="#A270E6" />
          </View>
        ) : (
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            {/* ─── route back button ─── */}
            <View
              className="absolute z-10 mt-12 ml-6"
              style={{
                // Pixel shadow
                shadowColor: '#000',
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.8}
                className="w-11 h-11 bg-[#FAD3E4] border-2 border-black rounded-lg justify-center items-center mt-10"
              >
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 24,
                    color: '#000',
                    lineHeight: 28,
                  }}
                >
                  ←
                </Text>
              </TouchableOpacity>
            </View>

            {/* ─── Main Form ─── */}
            <View className="flex-1 px-6 py-60">
              {/* ─── Retro Memory Card ─── */}
              <View
                style={{
                  backgroundColor: '#FAD3E4',
                  borderWidth: 3,
                  borderColor: '#000',
                  shadowColor: '#000',
                  shadowOffset: { width: 6, height: 6 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
                className="pb-2"
              >
                <ScrollView
                  contentContainerStyle={{ paddingVertical: 14 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* ─── Title Input ─── */}
                  <Text
                    className="text-lg mb-1 px-3 py-1"
                    style={{ fontFamily: 'PixelifySans', color: '#333' }}
                  >
                    Memory title
                  </Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter memory title"
                    placeholderTextColor="#aaa"
                    className="mb-2 mx-3 px-3 py-2 text-sm"
                    style={{
                      backgroundColor: '#FFF',
                      borderWidth: 1,
                      borderColor: '#000',
                      fontFamily: 'PixelifySans',
                    }}
                  />
                  {/* ─── Body Input ─── */}
                  <Text
                    className="text-lg mb-1 px-3 py-2"
                    style={{ fontFamily: 'PixelifySans', color: '#333' }}
                  >
                    Write a few words about your memory here
                  </Text>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      value={body}
                      onChangeText={setBody}
                      placeholder="Start typing..."
                      placeholderTextColor="#aaa"
                      multiline
                      className="mb-4 mx-3 px-3 py-2 text-sm"
                      style={{
                        minHeight: 60,
                        backgroundColor: '#FFF',
                        borderWidth: 1,
                        borderColor: '#000',
                        fontFamily: 'PixelifySans',
                        color: '#444',
                        paddingBottom: 24,
                      }}
                    />
                    <Text
                      style={{
                        position: 'absolute',
                        right: 24,
                        bottom: 20,
                        fontFamily: 'PixelifySans',
                        fontSize: 12,
                        color: countWords(body) >= MAX_WORDS ? 'red' : '#888',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        paddingHorizontal: 4,
                        borderRadius: 4,
                      }}
                    >
                      {countWords(body)} / {MAX_WORDS} words
                    </Text>
                  </View>

                  {/* ─── Pickers Row ─── */}
                  <View className="flex-row items-center justify-between px-3 mb-4">
                    <View className="flex-row gap-6">
                      <Pressable onPress={handleCameraPicker}>
                        <Image source={icons.camera} style={{ width: 26, height: 26 }} />
                      </Pressable>

                      <Pressable onPress={handlePickImage}>
                        <Image source={icons.photo} style={{ width: 24, height: 24 }} />
                      </Pressable>

                      {/* Temp video icon button */}
                      <Pressable onPress={handlePickVideo}>
                        <Image source={icons.video} style={{ width: 24, height: 24 }} />
                      </Pressable>

                      <Pressable onPress={() => setMapPickerVisible(true)}>
                        <Image source={icons.location} style={{ width: 24, height: 24 }} />
                      </Pressable>
                    </View>
                    {/* ─── Done Button ─── */}
                    <TouchableOpacity
                      onPress={handleDonePress}
                      activeOpacity={0.8}
                      disabled={saving}
                      style={{
                        alignSelf: 'center',
                        backgroundColor: '#E1D9FF',
                        paddingHorizontal: 24,
                        paddingVertical: 10,
                        borderColor: '#000',
                        borderWidth: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 3, height: 3 },
                        shadowOpacity: 1,
                        opacity: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 90,
                        height: 40,
                      }}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text
                          style={{
                            fontFamily: 'PixelifySans',
                            fontSize: 14,
                            color: '#000',
                          }}
                        >
                          Done
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {/* ─── Media Thumbnails ─── */}
                  {selectedMedia.length > 0 && (
                    <View className="px-3 mb-2">
                      <Text
                        style={{
                          fontFamily: 'PixelifySans',
                          fontSize: 15,
                          color: '#333',
                          marginBottom: 8,
                          fontWeight: 'bold',
                        }}
                      >
                        Selected Media ({selectedMedia.length}/{MAX_MEDIA})
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {selectedMedia.map((item, index) => (
                          <View
                            key={index}
                            style={{
                              width: 82,
                              height: 82,
                              marginRight: 8,
                              marginBottom: 8,
                              borderWidth: 1,
                              borderColor: '#000',
                              borderRadius: 8,
                              overflow: 'hidden',
                              position: 'relative',
                              backgroundColor: '#fff',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {item.type === 'image' ? (
                              <Image
                                source={{ uri: item.uri }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Video
                                source={{ uri: item.uri }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode={ResizeMode.COVER}
                                isMuted
                                shouldPlay={false}
                                useNativeControls={false}
                              />
                            )}
                            <Pressable
                              onPress={() =>
                                setSelectedMedia((prev) => prev.filter((_, i) => i !== index))
                              }
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 22,
                                height: 22,
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                borderRadius: 11,
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                              }}
                            >
                              <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                ✕
                              </Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
              {/* ─── Footer ─── */}
              <View
                style={{
                  backgroundColor: '#E1D9FF',
                  borderWidth: 3,
                  borderTopWidth: 0,
                  borderColor: '#000',
                  shadowColor: '#000',
                  shadowOffset: { width: 6, height: 6 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
                className="py-2 px-4"
              >
                <FooterRow
                  icon={icons.time}
                  text={`${footerDateLabel}: ${footerDateValue}`}
                  textColor="black"
                />
                {locationAddress ? (
                  <FooterRow
                    icon={icons.location2}
                    text={locationAddress}
                    textColor="black"
                    onClear={() => setLocationAddress('')}
                  />
                ) : null}
              </View>
            </View>
          </Animated.View>
        )}
      </ImageBackground>

      <MapPickerWebView
        visible={showWebPicker}
        onClose={() => setShowWebPicker(false)}
        onSelect={(lat, lng) => {
          setPickedCoords({ latitude: lat, longitude: lng });
          (async () => {
            const [rev] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            const formatted = [
              rev.name,
              rev.street,
              rev.city,
              rev.region,
              rev.postalCode,
              rev.country,
            ]
              .filter(Boolean)
              .join(', ');
            setLocationAddress(formatted);
          })();
        }}
      />
    </View>
  );
}
