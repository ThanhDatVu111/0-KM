'use client';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchEntries } from '@/apis/entries';
import Button from '@/components/Button';
import images from '@/constants/images';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookPage() {
  const { bookId: rawId } = useLocalSearchParams<{ bookId: string }>();
  const bookId = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    fetchEntries(bookId)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookId]);

  const goCreate = () => {
    router.push(`/library/${bookId}/create-entries`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="h-12 flex-row items-center px-4">
          <Pressable onPress={() => router.back()} className="justify-center">
            <Ionicons name="chevron-back" size={24} color="#000" />
          </Pressable>

          <View className="flex-1 items-center">
            <ActivityIndicator size="small" color="#000" />
          </View>

          {/* Invisible spacer so spinner stays centered */}
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  // — Empty state —
  if (entries.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* HEADER: Chevron + Centered Title */}
        <View className="h-12 flex-row items-center px-4">
          <Pressable onPress={() => router.back()} className="justify-center">
            <Ionicons name="chevron-back" size={24} color="#000" />
          </Pressable>

          <View className="flex-1 items-center">
            <Text className="text-lg font-semibold">Travel story</Text>
          </View>

          {/* Right spacer */}
          <View style={{ width: 24 }} />
        </View>

        {/* BODY: Centered Logo + Text */}
        <View className="flex-1 items-center px-6">
          <Image source={images.logo} className="w-40 h-28" resizeMode="contain" />
          <Text className="text-2xl font-bold mb-2">Create an entry</Text>
          <Text className="text-center text-sm text-gray-500">
            Tap the plus button to create your entry
          </Text>
        </View>

        {/* FOOTER: FAB pinned to bottom */}
        <View className="absolute bottom-40 left-0 right-0 items-center">
          <Button
            label="+"
            onPress={goCreate}
            size="w-50 mt-8 px-6 py-4"
            color="bg-accent"
            textClassName="text-white text-lg text-center"
          />
        </View>
      </SafeAreaView>
    );
  }

  // — List of entries + FAB —
  return (
    <ScrollView>
      <View className="h-12 flex-row justify-center items-center px-4">
        <Pressable onPress={() => router.back()} className="justify-center">
          <Ionicons name="chevron-back" size={24} color="#000" />
        </Pressable>

        <View className="flex-1 items-center">
          <Text className="text-lg font-semibold">Travel story</Text>
        </View>

        {/* Right spacer */}
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        className="p-4"
        renderItem={({ item }) => (
          <View className="bg-white rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold mb-1">{item.title}</Text>
            <Text className="text-sm text-gray-600" numberOfLines={2}>
              {item.body}
            </Text>
          </View>
        )}
      />
      {/* Login Button */}
      <Button
        label="+"
        onPress={goCreate}
        size="w-72 mt-8 px-6 py-4"
        color="bg-accent"
        textClassName="text-white text-lg text-center"
      />
    </ScrollView>
  );
}
