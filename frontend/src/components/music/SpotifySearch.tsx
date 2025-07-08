import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  uri: string;
}

interface Props {
  onTrackSelect: (track: SpotifyTrack) => void;
  onCancel: () => void;
}

export function SpotifySearch({ onTrackSelect, onCancel }: Props) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchTracks = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Get valid access token
      const accessToken = await SecureStore.getItemAsync('spotify_access_token');
      if (!accessToken) {
        Alert.alert('Error', 'Please connect to Spotify first');
        return;
      }

      // Search Spotify API
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('TOKEN_EXPIRED');
        }
        throw new Error(`Failed to search tracks: ${response.status}`);
      }

      const data = await response.json();

      const searchResults: SpotifyTrack[] = data.tracks.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        albumArt: track.album?.images[0]?.url || '',
        duration: Math.floor(track.duration_ms / 1000),
        uri: track.uri,
      }));

      setTracks(searchResults);
    } catch (error: any) {
      console.error('Error searching tracks:', error);

      if (error.message === 'TOKEN_EXPIRED') {
        Alert.alert(
          'Spotify Connection Expired',
          'Your Spotify connection has expired. Please reconnect to Spotify.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reconnect',
              onPress: async () => {
                // Clear tokens and force reconnection
                await SecureStore.deleteItemAsync('spotify_access_token');
                await SecureStore.deleteItemAsync('spotify_refresh_token');
                await SecureStore.deleteItemAsync('spotify_token_expiry');
                onCancel(); // Close search modal
              },
            },
          ],
        );
      } else {
        Alert.alert('Error', 'Failed to search tracks. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderTrack = ({ item }: { item: SpotifyTrack }) => (
    <TouchableOpacity
      onPress={() => onTrackSelect(item)}
      className="flex-row items-center p-3 bg-white/10 rounded-lg mb-2"
    >
      <Image source={{ uri: item.albumArt }} className="w-12 h-12 rounded" />
      <View className="flex-1 ml-3">
        <Text className="text-white font-pmedium text-sm" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-white/70 font-pregular text-xs" numberOfLines={1}>
          {item.artist} • {item.album}
        </Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color="white" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black/90 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white font-pbold text-lg">Search Spotify</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View className="flex-row items-center bg-white/10 rounded-lg p-3 mb-4">
        <Ionicons name="search" size={20} color="white" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a song..."
          placeholderTextColor="#999"
          className="flex-1 ml-3 text-white font-pregular"
          onSubmitEditing={() => searchTracks(query)}
        />
        {isLoading && <Ionicons name="hourglass" size={20} color="white" />}
      </View>

      {/* Search Results */}
      <FlatList
        data={tracks}
        renderItem={renderTrack}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading && query ? (
            <Text className="text-white/70 text-center font-pregular">No tracks found</Text>
          ) : null
        }
      />
    </View>
  );
}
