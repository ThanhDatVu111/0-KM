import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { spotifyService } from '../../services/spotifyService';

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
  const [isConnected, setIsConnected] = useState(false);

  // Check if Spotify is connected on mount
  React.useEffect(() => {
    checkSpotifyConnection();
  }, []);

  const checkSpotifyConnection = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('spotify_access_token');
      const refreshToken = await SecureStore.getItemAsync('spotify_refresh_token');
      const tokenExpiry = await SecureStore.getItemAsync('spotify_token_expiry');

      if (accessToken && refreshToken && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        const now = Date.now();

        if (now < expiryTime) {
          setIsConnected(true);
          return;
        } else {
          // Token expired, try to refresh
          const refreshSuccess = await refreshSpotifyToken(refreshToken);
          setIsConnected(refreshSuccess);
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      setIsConnected(false);
    }
  };

  const refreshSpotifyToken = async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' + btoa('f805d2782059483e801da7782a7e04c8:06b28132afaf4c0b9c1f3224c268c35b'),
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const tokenData = await response.json();

      if (tokenData.access_token) {
        // Store the new tokens
        await SecureStore.setItemAsync('spotify_access_token', tokenData.access_token);
        if (tokenData.refresh_token) {
          await SecureStore.setItemAsync('spotify_refresh_token', tokenData.refresh_token);
        }
        await SecureStore.setItemAsync(
          'spotify_token_expiry',
          (Date.now() + (tokenData.expires_in || 3600) * 1000).toString(),
        );

        console.log('✅ Spotify token refreshed successfully');
        return true;
      } else {
        console.error('❌ Failed to refresh Spotify token');
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing Spotify token:', error);
      return false;
    }
  };

  const connectSpotify = async () => {
    try {
      console.log('🔗 [DEBUG] Starting Spotify OAuth...');

      // Use the same redirect URI pattern as Google OAuth
      const redirectUri = AuthSession.makeRedirectUri();
      console.log('🔗 Redirect URI:', redirectUri);

      // Spotify OAuth scopes
      const scopes = [
        'user-read-private',
        'user-read-email',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'streaming',
        'playlist-read-private',
        'playlist-read-collaborative',
      ];

      // Create the Spotify authorization URL
      const clientId = 'f805d2782059483e801da7782a7e04c8';
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=state`;

      console.log('🔗 Auth URL:', authUrl);
      console.log('🔗 [DEBUG] About to open WebBrowser...');

      // Open the Spotify authorization URL in a web browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      console.log('🔗 [DEBUG] WebBrowser result:', result);

      if (result.type === 'success') {
        // Extract the authorization code from the URL
        console.log('🔗 [DEBUG] Success redirect URL:', result.url);
        const url = new URL(result.url);
        console.log(
          '🔗 [DEBUG] URL search params:',
          Object.fromEntries(url.searchParams.entries()),
        );

        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        const state = url.searchParams.get('state');

        console.log('🔗 [DEBUG] Extracted params:', { code: !!code, error, state });

        if (error) {
          console.error('❌ [DEBUG] Spotify OAuth error:', error);
          Alert.alert('Error', `Spotify OAuth error: ${error}`);
          return false;
        }

        if (code) {
          console.log('✅ Got authorization code:', code);

          // Exchange the code for access tokens
          try {
            console.log('🔄 [DEBUG] Exchanging code for tokens...');
            console.log('🔄 [DEBUG] Code:', code);
            console.log('🔄 [DEBUG] Redirect URI:', redirectUri);

            const requestBody = new URLSearchParams();
            requestBody.append('grant_type', 'authorization_code');
            requestBody.append('code', code);
            requestBody.append('redirect_uri', redirectUri);

            console.log('🔄 [DEBUG] Request body:', requestBody.toString());

            const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                  'Basic ' +
                  btoa('f805d2782059483e801da7782a7e04c8:06b28132afaf4c0b9c1f3224c268c35b'),
              },
              body: requestBody.toString(),
            });

            console.log('🔄 [DEBUG] Token response status:', tokenResponse.status);
            console.log(
              '🔄 [DEBUG] Token response headers:',
              Object.fromEntries(tokenResponse.headers.entries()),
            );

            const tokenData = await tokenResponse.json();
            console.log('🎵 Spotify tokens response:', tokenData);

            if (tokenData.access_token) {
              // Store tokens securely
              await SecureStore.setItemAsync('spotify_access_token', tokenData.access_token);
              await SecureStore.setItemAsync('spotify_refresh_token', tokenData.refresh_token);
              await SecureStore.setItemAsync(
                'spotify_token_expiry',
                (Date.now() + (tokenData.expires_in || 3600) * 1000).toString(),
              );

              setIsConnected(true);
              Alert.alert('Success!', 'Spotify connected successfully!');
              return true;
            } else {
              console.error('❌ [DEBUG] No access token in response:', tokenData);
              if (tokenData.error) {
                console.error(
                  '❌ [DEBUG] Spotify error:',
                  tokenData.error,
                  tokenData.error_description,
                );
                Alert.alert(
                  'Error',
                  `Spotify error: ${tokenData.error_description || tokenData.error}`,
                );
              } else {
                Alert.alert('Error', 'Failed to get access tokens. Please try again.');
              }
              return false;
            }
          } catch (tokenError) {
            console.error('❌ [DEBUG] Error exchanging code for tokens:', tokenError);
            Alert.alert('Error', 'Failed to get access tokens. Please try again.');
            return false;
          }
        } else {
          Alert.alert('Error', 'Failed to get authorization code from Spotify');
          return false;
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled Spotify authorization');
        return false;
      } else {
        console.log('🔗 [DEBUG] OAuth failed with result:', result);
        Alert.alert('Error', 'Failed to connect to Spotify');
        return false;
      }
    } catch (error) {
      console.error('🔗 [DEBUG] Error in connectSpotify:', error);
      Alert.alert('Error', 'Failed to connect to Spotify. Please try again.');
      return false;
    }
  };

  const searchTracks = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Check if connected to Spotify
      if (!isConnected) {
        Alert.alert('Spotify Not Connected', 'Please connect your Spotify account first.', [
          { text: 'Cancel', style: 'cancel', onPress: onCancel },
          {
            text: 'Connect',
            onPress: async () => {
              const success = await connectSpotify();
              if (success) {
                // Retry the search after successful connection
                searchTracks(searchQuery);
              }
            },
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
              onPress: async () => {
                const success = await connectSpotify();
                if (success) {
                  // Retry the search after successful reconnection
                  searchTracks(searchQuery);
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
