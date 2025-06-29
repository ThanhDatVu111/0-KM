'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteEntryApi, fetchEntries } from '@/apis/entries';
import images from '@/constants/images';
import { LinearGradient } from 'expo-linear-gradient';
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

  const updateEntry = (entry: any) => {
    router.push({
      pathname: `/library/[bookId]/update-entry`,
      params: {
        bookId: bookId,
        entryId: entry.id,
        title: entry.title,
        body: entry.body,
        media: entry.media_paths,
        location: entry.location?.address || '',
        updatedAt: entry.updated_at,
      },
    });
  };

  const goCreate = () => {
    router.push(`/library/${bookId}/create-entry`);
  };

  function renderPlusButton(onPress: () => void) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          width: 80,
          height: 80,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 16,
          shadowColor: '#000',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
        }}
      >
        <LinearGradient
          colors={['#FAD3E4', '#A270E6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 48,
              color: '#fff',
              lineHeight: 52,
            }}
          >
            +
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  // — List of entries + FAB —
  // Choose background based on state
  let bgImage = images.entryCardBg;
  if (entries.length === 0) bgImage = images.createEntryBg;
  // Remove loadingScreen image for smoother transitions

  return (
    <ImageBackground
      source={bgImage}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      {/* Back button */}
      <View
        className="absolute z-10 mt-12 ml-6"
        style={{
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

      {/* Loading overlay */}
      {loading && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
            backgroundColor: 'rgba(255,255,255,0.2)', // optional: slight overlay
          }}
        >
          <ActivityIndicator size="large" color="#A270E6" />
        </View>
      )}

      {/* Main content */}
      {!loading && entries.length === 0 && (
        <View className="flex-1 items-center px-6 py-64">
          <Image source={images.logo} className="w-64 h-32 mb-4" resizeMode="contain" />
          <Text
            className="text-[30px] mb-2 text-center"
            style={{
              fontFamily: 'PixelifySans',
              color: 'white',
              textShadowColor: 'black',
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 0,
            }}
          >
            Create an entry
          </Text>
          <Text
            className="text-[18px] mb-8 text-center"
            style={{
              fontFamily: 'PixelifySans',
              color: 'white',
              textShadowColor: 'black',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 0,
            }}
          >
            Tap the plus button to create your entry
          </Text>
          <View className="items-center">{renderPlusButton(goCreate)}</View>
        </View>
      )}

      {!loading && entries.length > 0 && (
        <ScrollView className="py-36" contentContainerStyle={{ paddingBottom: 130 }}>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              title={entry.title}
              body={entry.body}
              createdAt={entry.created_at}
              media={entry.media_paths}
              location={entry.location}
              onDelete={() => deleteEntry(bookId, entry.id)}
              onEdit={() => updateEntry(entry)}
            />
          ))}
          <View className="items-center">{renderPlusButton(goCreate)}</View>
        </ScrollView>
      )}
    </ImageBackground>
  );
}
