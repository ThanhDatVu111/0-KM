'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteEntryApi, fetchEntries } from '@/apis/entries';
import images from '@/constants/images';
import { Ionicons } from '@expo/vector-icons';
import EntryCard from '@/components/EntryCard';

export default function BookPage() {
  const { bookId: rawId } = useLocalSearchParams<{ bookId: string }>();
  const bookId = Array.isArray(rawId) ? rawId[0] : rawId;
  console.log('Book ID:', bookId);
  const router = useRouter();

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (!bookId) return;

      const fetchData = async () => {
        setLoading(true);
        try {
          const data = await fetchEntries(bookId);
          setEntries(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      const timeoutId = setTimeout(fetchData, 300); // Debounce manually
      return () => clearTimeout(timeoutId); // Cleanup timeout
    }, [bookId]),
  );

  const deleteEntry = async (bookId: string, entryId: string) => {
    try {
      console.log('Deleting entry:', entryId);
      console.log('Book ID:', bookId);
      await deleteEntryApi(bookId, entryId);
      // Remove it from local state so the UI updates immediately
      setEntries((old) => old.filter((e) => e.id !== entryId));
    } catch (err) {
      console.error('Failed to delete in BookPage', err);
    }
  };

  const editEntry = (entry: any) => {
    router.push({
      pathname: `/library/[bookId]/update-entry`,
      params: {
        bookId: bookId,
        entryId: entry.id,
        title: entry.title,
        body: entry.body,
        media: JSON.stringify(entry.media),
        location: entry.location?.address || '',
        updatedAt: entry.updated_at,
      },
    });
  };

  const goCreate = () => {
    router.push(`/library/${bookId}/create-entry`);
  };

  if (loading) {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      );
    }
  }

  // — Empty state —
  if (entries.length === 0) {
    return (
      <View className="flex-1 items-center px-6 mt-16">
        <Image source={images.logo} className="w-45 h-28" resizeMode="contain" />
        <Text className="text-2xl font-bold mb-2">Create an entry</Text>
        <Text className="text-center text-sm text-gray-500">
          Tap the plus button to create your entry
        </Text>
        <TouchableOpacity
          onPress={goCreate}
          className="
            w-20 h-20            
            rounded-full          
            bg-accent          
            items-center justify-center 
            shadow-lg         
            mt-24
            active:scale-95
            active:shadow-none"
        >
          <Text className="text-white text-4xl">+</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // — List of entries + FAB —
  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            title={entry.title}
            body={entry.body}
            createdAt={entry.created_at}
            media={entry.media}
            location={entry.location}
            onDelete={() => deleteEntry(bookId, entry.id)}
            onEdit={() => editEntry(entry)}
          />
        ))}
        <TouchableOpacity
          onPress={goCreate}
          className="
            w-20 h-20            
            rounded-full          
            bg-accent          
            self-center
            items-center justify-center
            shadow-lg         
            active:scale-95
            active:shadow-none
            border border-red-500"
        >
          <Text className="text-white text-4xl">+</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* FAB pinned to the bottom */}
    </View>
  );
}
