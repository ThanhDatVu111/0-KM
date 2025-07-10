import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../../utils/supabase';

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

  const getSpotifyAccessToken = async () => {
    try {
      // Get the current session from Supabase
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting Supabase session:', error);
        return null;
      }

      // Check if we have Spotify provider data
      const spotifyProvider = session?.user?.app_metadata?.providers?.spotify;

      if (!spotifyProvider) {
        console.log('No Spotify provider found in session');
        return null;
      }

      // Get the access token from the provider data
      const accessToken = spotifyProvider.access_token;

      if (!accessToken) {
        console.log('No access token found in Spotify provider data');
        return null;
      }

      return accessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      return null;
    }
  };

  const searchTracks = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Get access token from Supabase session
      const accessToken = await getSpotifyAccessToken();
      if (!accessToken) {
        Alert.alert('Spotify Not Connected', 'Please connect your Spotify account first.', [
          { text: 'Cancel', style: 'cancel', onPress: onCancel },
          {
            text: 'Connect',
            onPress: async () => {
              try {
                // Use Supabase OAuth for Spotify
                                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'spotify',
                    options: {
                      scopes: [
                        'user-read-private',
                        'user-read-email',
                        'user-read-playback-state',
                        'user-modify-playback-state',
                        'user-read-currently-playing',
                        'streaming',
                        'playlist-read-private',
                        'playlist-read-collaborative',
                      ].join(' '),
                      redirectTo: '0km-app://',
                    },
                  });

                if (error) {
                  Alert.alert('Error', 'Failed to connect to Spotify');
                  return;
                }

                // Close search modal and let the OAuth flow complete
                onCancel();
              } catch (error) {
                Alert.alert('Error', 'Failed to connect to Spotify');
              }
            },
          },
        ]);
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
          'Your Spotify connection has expired. Would you like to reconnect?',
          [
            { text: 'Cancel', style: 'cancel', onPress: onCancel },
            {
              text: 'Reconnect',
              onPress: async () => {
                try {
                  // Sign out and reconnect via Supabase OAuth
                  await supabase.auth.signOut();

                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'spotify',
                    options: {
                      scopes: [
                        'user-read-private',
                        'user-read-email',
                        'user-read-playback-state',
                        'user-modify-playback-state',
                        'user-read-currently-playing',
                        'streaming',
                        'playlist-read-private',
                        'playlist-read-collaborative',
                      ].join(' '),
                      redirectTo: '0km-app://',
                    },
                  });

                  if (error) {
                    Alert.alert('Error', 'Failed to reconnect to Spotify');
                    return;
                  }

                  // Close search modal and let the OAuth flow complete
                  onCancel();
                } catch (error) {
                  Alert.alert('Error', 'Failed to reconnect to Spotify');
                }
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
