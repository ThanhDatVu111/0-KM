import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface MediaItem {
  uri: string;
}

interface EntryCardProps {
  title: string;
  body: string;
  createdAt: string;
  media: MediaItem[];
  location?: { address: string } | null;
  onDelete: () => void;
  onEdit: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({
  title,
  body,
  createdAt,
  media,
  location,
  onDelete,
  onEdit,
}) => {
  // Format the date to a more readable format
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible((v) => !v);

  const extraCount = media.length > 5 ? media.length - 5 : 0;

  // Grab up to 5 URIs
  const uri0 = media[0]?.uri;
  const uri1 = media[1]?.uri;
  const uri2 = media[2]?.uri;
  const uri3 = media[3]?.uri;
  const uri4 = media[4]?.uri;

  const renderCollage = () => {
    switch (media.length) {
      // ─── CASE 0: no images ───
      case 0:
        return null;

      // ─── CASE 1: one image fills entire width ───
      case 1:
        return (
          <View className="h-56">
            <Image
              source={{ uri: uri0! }}
              className="w-full h-full rounded-2xl border-2 border-white"
              resizeMode="cover"
            />
          </View>
        );

      // ─── CASE 2: two images side-by-side (50/50) ───
      case 2:
        return (
          <View className="flex-row h-56 space-x-1">
            <Image
              source={{ uri: uri0! }}
              className="w-1/2 h-full rounded-2xl border-2 border-white"
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri1! }}
              className="w-1/2 h-full rounded-2xl border-2 border-white"
              resizeMode="cover"
            />
          </View>
        );

      // ─── CASE 3: one large left + two stacked on right ───
      case 3:
        return (
          <View className="flex-row h-56 space-x-1">
            {/* Left: 50% width */}
            <Image
              source={{ uri: uri0! }}
              className="w-1/2 h-full rounded-2xl border-2 border-white"
              resizeMode="cover"
            />
            {/* Right: two stacked (each h-1/2) */}
            <View className="w-1/2 h-full flex-col space-y-1">
              <Image
                source={{ uri: uri1! }}
                className="w-full h-1/2 rounded-2xl border-2 border-white"
                resizeMode="cover"
              />
              <Image
                source={{ uri: uri2! }}
                className="w-full h-1/2 rounded-2xl border-2 border-white"
                resizeMode="cover"
              />
            </View>
          </View>
        );

      // ─── CASE 4: 2×2 grid, equal squares ───
      case 4:
        return (
          <View className="flex-row flex-wrap h-56">
            <Image
              source={{ uri: uri0! }}
              className="w-1/2 h-1/2 rounded-2xl border-2 border-white"
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri1! }}
              className="w-1/2 h-1/2 rounded-2xl border-2 border-white"
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri2! }}
              className="w-1/2 h-1/2 rounded-2xl border-2 border-white"
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri3! }}
              className="w-1/2 h-1/2 rounded-2xl border-2 border-white"
              resizeMode="cover"
            />
          </View>
        );

      // ─── CASE 5+: one large left + 2×2 mini + “+N” overlay ───
      default:
        return (
          <View className="flex-row h-56 space-x-1">
            {/* Left: 50% width */}
            <Image
              source={{ uri: uri0! }}
              className="w-1/2 h-full rounded-2xl border-2 border-white"
              resizeMode="cover"
            />
            {/* Right: a 2×2 grid */}
            <View className="w-1/2 h-full flex-row flex-wrap relative">
              {/* Top-left mini (fills quarter of total) */}
              <Image
                source={{ uri: uri1! }}
                className="w-1/2 h-1/2 rounded-2xl border-2 border-white"
                resizeMode="cover"
              />
              {/* Top-right mini */}
              <Image
                source={{ uri: uri2! }}
                className="w-1/2 h-1/2 rounded-2xl border-2 border-white"
                resizeMode="cover"
              />
              {/* Bottom-left mini */}
              <Image
                source={{ uri: uri3! }}
                className="w-1/2 h-1/2 rounded-2xl border-2 border-white"
                resizeMode="cover"
              />
              {/* Bottom-right mini with +N overlay */}
              <View className="relative w-1/2 h-1/2 rounded-2xl overflow-hidden">
                <Image
                  source={{ uri: uri4! }}
                  className="w-full h-full rounded-2xl border-2 border-white"
                  resizeMode="cover"
                />
                {extraCount > 0 && (
                  <>
                    {/* 1) The blur layer */}
                    <BlurView
                      intensity={10}
                      tint="default"
                      className="absolute inset-0 rounded-2xl"
                    />

                    {/* 2) The “+N” text on top */}
                    <View className="absolute inset-0 flex items-center justify-center rounded-2xl">
                      <Text className="text-white font-semibold text-lg">+{extraCount}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <View className="mx-4 bg-white rounded-2xl shadow-md mb-14">
      {renderCollage()}
      {/* ─── Text Section ─── */}
      <View className="p-4">
        <View className="relative flex-row justify-between items-center">
          <Text className="text-lg font-semibold mb-2">{title}</Text>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" onPress={toggleMenu} />
          {/* ─── Dropdown Menu (edit / delete) ─── */}
          {menuVisible && (
            <View className="absolute top-7 right-0 bg-white shadow-md rounded-md border border-gray-200 z-50">
              <Pressable
                onPress={() => {
                  onEdit(); // ← calls BookPage.handleEditEntry(...)
                  setMenuVisible(false);
                }}
                className="px-4 py-2"
              >
                <Text>Edit</Text>
              </Pressable>

              <View className="h-px bg-gray-200 my-1" />

              <Pressable
                onPress={() => {
                  onDelete(); // ← calls BookPage.handleDeleteEntry(...)
                  setMenuVisible(false);
                }}
                className="px-4 py-2"
              >
                <Text className="text-red-600">Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
        <Text className="text-sm text-gray-500 mb-2" numberOfLines={3}>
          {body}
        </Text>
        <Text className="text-xs text-gray-400">{formattedDate}</Text>

        {location?.address && <Text className="text-xs text-gray-400">{location.address}</Text>}
      </View>
    </View>
  );
};

export default EntryCard;
