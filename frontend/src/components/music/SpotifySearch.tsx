import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spotifyService } from '../../services/spotifyService';
import { useSpotifyAuth } from '../../hooks/useSpotifyAuth';

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
  onReconnect?: () => void;
}

export function SpotifySearch({ onTrackSelect, onCancel, onReconnect }: Props) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { status, connect } = useSpotifyAuth();

  const searchTracks = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Check if connected to Spotify
      if (status !== 'connected') {
        Alert.alert('Spotify Not Connected', 'Please connect your Spotify account first.', [
          { text: 'Cancel', style: 'cancel', onPress: onCancel },
          {
            text: 'Connect',
            onPress: connect,
          },
        ]);
        return;
      }

      // Search using the spotify service
      const searchResults = await spotifyService.searchTracks(searchQuery);
      setTracks(searchResults);
    } catch (error: any) {
      console.error('Error searching tracks:', error);

      if (error.message === 'TOKEN_EXPIRED') {
        Alert.alert(
          'Spotify Connection Expired',
          'Your Spotify connection has expired. Would you like to reconnect?',
          [
            { text: 'Cancel', style: 'cancel', onPress: onCancel },
            {
              text: 'Reconnect',
              onPress: connect,
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
