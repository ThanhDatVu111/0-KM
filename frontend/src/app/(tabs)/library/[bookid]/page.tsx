'use client';

import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteEntryApi, fetchEntries } from '@/apis/entries';
import images from '@/constants/images';
import { LinearGradient } from 'expo-linear-gradient';
import EntryCard from '@/components/EntryCard';

export default function BookPage() {
  const {
    bookId: rawId,
    title: rawTitle,
    refresh,
  } = useLocalSearchParams<{
    bookId: string;
    title: string;
    refresh?: string;
  }>();
  const bookId = Array.isArray(rawId) ? rawId[0] : rawId;
  const bookTitle = Array.isArray(rawTitle) ? rawTitle[0] : rawTitle;
  const refreshParam = Array.isArray(refresh) ? refresh[0] : refresh;
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  // Fetch data function
  const fetchData = async () => {
    if (!bookId) return;

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

  // Initial load effect
  useEffect(() => {
    if (!hasInitialLoaded && bookId) {
      setHasInitialLoaded(true);
      fetchData();
    }
  }, [bookId, hasInitialLoaded]);

  // Refresh when refresh parameter changes (from create/edit success)
  useEffect(() => {
    if (refreshParam && hasInitialLoaded) {
      fetchData();
    }
  }, [refreshParam]);

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
    router.push({
      pathname: `/library/[bookId]/create-entry`,
      params: { bookId },
    });
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
  return (
    <View className="flex-1">
      {/* Fixed Header */}
      <View
        className="absolute top-0 left-0 right-0 z-20"
        style={{
          paddingTop: 70, // Safe area padding
          paddingBottom: 16,
          paddingHorizontal: 20,
          // Transparent background - no backgroundColor
        }}
      >
        <View className="flex-row items-center justify-between">
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="w-11 h-11 bg-[#FAD3E4] border-2 border-black rounded-lg justify-center items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
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

          {/* Book Title */}
          <View className="flex-1 mx-4">
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontFamily: 'PressStart2P',
                fontSize: 28,
                color: '#EB79FF',
                textAlign: 'center',
                textShadowColor: 'black',
                textShadowOffset: { width: 3, height: 3 },
                textShadowRadius: 0,
              }}
            >
              {bookTitle}
            </Text>
          </View>

          {/* Placeholder for symmetry */}
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Background Image with Content */}
      <ImageBackground
        source={
          loading
            ? images.loadingScreen
            : entries.length === 0
              ? images.createEntryBg
              : images.entryCardBg
        }
        resizeMode="cover"
        style={{ flex: 1, paddingTop: 120 }} // Add padding to account for fixed header
      >
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
          <View className="flex-1 items-center px-6 py-24">
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
          <ScrollView
            className="px-4"
            contentContainerStyle={{ paddingBottom: 130, paddingTop: 20 }}
          >
            {entries
              .slice()
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((entry) => (
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
    </View>
  );
}
