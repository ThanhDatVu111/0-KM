'use client';
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Image, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteEntryApi, fetchEntries } from '@/apis/entries';
import Button from '@/components/Button';
import images from '@/constants/images';
import { Ionicons } from '@expo/vector-icons';
import EntryCard from '@/components/EntryCard';

export default function BookPage() {
  const { bookId: rawId } = useLocalSearchParams<{ bookId: string }>();
  const bookId = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (!bookId) return;
      setLoading(true);
      fetchEntries(bookId)
        .then(setEntries)
        .catch(console.error)
        .finally(() => setLoading(false));
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
    return (
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
    );
  }

  // — Empty state —
  if (entries.length === 0) {
    return (
      <View className="flex-1 items-center px-6">
        <Image source={images.logo} className="w-45 h-28" resizeMode="contain" />
        <Text className="text-2xl font-bold mb-2">Create an entry</Text>
        <Text className="text-center text-sm text-gray-500">
          Tap the plus button to create your entry
        </Text>
        <View className="absolute bottom-32 left-0 right-0 items-center mb-8">
          <Button
            label="+"
            onPress={goCreate}
            size="w-20 h-15 rounded-full" // make it a circular button
            color="bg-accent"
            textClassName="text-white text-3xl text-center"
          />
        </View>
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
            location={entry.location.address}
            onDelete={() => deleteEntry(bookId, entry.id)}
            onEdit={() => editEntry(entry)}
          />
        ))}
        <View className="absolute bottom-20 left-0 right-0 items-center">
          <Button
            label="+"
            onPress={goCreate}
            size="w-20 h-15 rounded-full" // make it a circular button
            color="bg-accent"
            textClassName="text-white text-3xl text-center"
          />
        </View>
      </ScrollView>
      {/* FAB pinned to the bottom */}
    </View>
  );
}
