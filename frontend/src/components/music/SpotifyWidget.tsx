import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSharedSpotifyTrack, SharedSpotifyTrack } from '../../hooks/useSharedSpotifyTrack';
import { useSpotifyPlayback } from '../../hooks/useSpotifyPlayback';
import { spotifyService } from '../../services/spotifyService';

type Props = {
  roomId?: string;
  onPress?: () => void;
  className?: string;
  canControl?: boolean;
  isLoading?: boolean;
};

function RetroHeader({ title }: { title: string }) {
  return (
    <View className="bg-[#6536DD] border-b-2 border-black px-4 py-3 items-center rounded-t-md">
      <View className="relative">
        {[
          [-2, 0],
          [2, 0],
          [0, -2],
          [0, 2],
        ].map(([dx, dy], index) => (
          <Text
            key={index}
            style={{
              position: 'absolute',
              fontFamily: 'PressStart2P',
              fontSize: 12,
              color: 'white',
              left: dx,
              top: dy,
            }}
          >
            {title}
          </Text>
        ))}

        <Text
          style={{
            fontFamily: 'PressStart2P',
            fontSize: 12,
            color: '#F24187',
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

export function SpotifyWidget({
  roomId,
  onPress,
  className = '',
  canControl = false,
  isLoading = false,
}: Props) {
  const { userId } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { track, updateTrack, clearTrack } = useSharedSpotifyTrack(roomId || null);
  const { playbackState, togglePlayPause, skipToNext, skipToPrevious } = useSpotifyPlayback();
  const [isPlaying, setIsPlaying] = useState(false);

  // Always declare currentTrack at the top, before any return
  // Prioritize Spotify playback state, fallback to shared room track data
  const currentTrack = playbackState?.currentTrack
    ? {
        track_name: playbackState.currentTrack.name,
        artist_name: playbackState.currentTrack.artist,
        album_name: playbackState.currentTrack.album,
        album_art_url: playbackState.currentTrack.albumArt,
        duration_ms: playbackState.currentTrack.duration * 1000,
        track_uri: playbackState.currentTrack.uri,
      }
    : track;

  // Utility function to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if Spotify is connected on mount
  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  // Debug: Log track data when it changes
  useEffect(() => {
    if (track) {
      console.log('🎵 [DEBUG] Shared track data received:', {
        track_name: track.track_name,
        artist_name: track.artist_name,
        album_name: track.album_name,
        album_art_url: track.album_art_url,
        duration_ms: track.duration_ms,
        track_uri: track.track_uri,
      });
    }
  }, [track]);

  // Debug: Log Spotify playback state when it changes
  useEffect(() => {
    if (playbackState?.currentTrack) {
      console.log('🎵 [DEBUG] Spotify playback state received:', {
        track_name: playbackState.currentTrack.name,
        artist_name: playbackState.currentTrack.artist,
        album_name: playbackState.currentTrack.album,
        album_art_url: playbackState.currentTrack.albumArt,
        duration: playbackState.currentTrack.duration,
        uri: playbackState.currentTrack.uri,
        is_playing: playbackState.isPlaying,
        progress: playbackState.progress,
      });
    }
  }, [playbackState]);

  // Update isPlaying state based on Spotify playback state
  useEffect(() => {
    if (playbackState) {
      setIsPlaying(playbackState.isPlaying);
    }
  }, [playbackState]);

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
      setIsConnecting(true);

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
          return;
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
            }
          } catch (tokenError) {
            console.error('❌ [DEBUG] Error exchanging code for tokens:', tokenError);
            Alert.alert('Error', 'Failed to get access tokens. Please try again.');
          }
        } else {
          Alert.alert('Error', 'Failed to get authorization code from Spotify');
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled Spotify authorization');
      } else {
        console.log('🔗 [DEBUG] OAuth failed with result:', result);
        Alert.alert('Error', 'Failed to connect to Spotify');
      }
    } catch (error) {
      console.error('🔗 [DEBUG] Error in connectSpotify:', error);
      Alert.alert('Error', 'Failed to connect to Spotify. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectSpotify = async () => {
    try {
      // Clear stored tokens
      await SecureStore.deleteItemAsync('spotify_access_token');
      await SecureStore.deleteItemAsync('spotify_refresh_token');
      await SecureStore.deleteItemAsync('spotify_token_expiry');

      setIsConnected(false);
      Alert.alert('Success', 'Disconnected from Spotify');
    } catch (error) {
      console.error('Error disconnecting from Spotify:', error);
      Alert.alert('Error', 'Failed to disconnect from Spotify');
    }
  };

  // Determine if user is controlling the playback
  const isController = track?.controlled_by_user_id === userId;

  // Handle play/pause
  const handlePlayPause = async () => {
    console.log('🎵 [DEBUG] Play/pause button clicked');
    console.log('🎵 [DEBUG] Current track:', currentTrack?.track_uri);
    console.log('🎵 [DEBUG] Room ID:', roomId);
    console.log('🎵 [DEBUG] Is playing:', isPlaying);

    if (!currentTrack?.track_uri) {
      console.log('❌ [DEBUG] No track URI, cannot play/pause');
      return;
    }

    try {
      // Always use Spotify API directly for play/pause control
      console.log('🎵 [DEBUG] Using Spotify API directly for play/pause');
      await togglePlayPause();
      console.log('✅ [DEBUG] Spotify API call completed');

      // Update local state after successful API call
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('❌ [DEBUG] Error toggling play/pause:', error);
      Alert.alert('Error', 'Failed to control playback');
    }
  };

  // Handle track removal
  const handleRemoveTrack = async () => {
    if (!roomId) return;

    try {
      await clearTrack();
      if (onPress) onPress();
    } catch (error) {
      console.error('Error removing track:', error);
      Alert.alert('Error', 'Failed to remove track');
    }
  };

  // State 1: Not connected to Spotify
  if (!isConnected) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="SPOTIFY" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <View className="items-center">
            <Ionicons name="musical-notes" size={32} color="#6536DD" />
            <Text className="font-pmedium text-lg text-black mt-2 mb-3 text-center">
              Connect to Spotify
            </Text>
            <Text className="text-black/70 font-pregular text-sm text-center px-4 mb-4">
              Connect your Spotify account to share music with your partner
            </Text>
            <TouchableOpacity
              onPress={connectSpotify}
              disabled={isConnecting}
              className="bg-[#6536DD] border-2 border-black"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 4,
              }}
            >
              <View className="bg-[#6536DD] px-6 py-3">
                <Text className="text-white font-pbold text-sm">
                  {isConnecting ? 'Connecting...' : 'Connect Spotify'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // State 2: Connected but no track
  // Show "Search Music" only if there's no track data from either Spotify playback state OR shared room data
  console.log('🎵 [DEBUG] Checking track state:', {
    playbackStateTrackUri: playbackState?.currentTrack?.uri,
    sharedTrackUri: track?.track_uri,
    hasPlaybackState: !!playbackState?.currentTrack,
    hasSharedTrack: !!track,
  });

  if (!playbackState?.currentTrack?.uri && !track?.track_uri) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="SPOTIFY" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <View className="items-center">
            <Ionicons name="musical-notes" size={32} color="#6536DD" />
            <Text className="font-pmedium text-lg text-black mt-2 mb-3 text-center">
              Add a Track
            </Text>
            <Text className="text-black/70 font-pregular text-sm text-center px-4 mb-4">
              Search for a song to share with your partner
            </Text>
            <TouchableOpacity
              onPress={onPress}
              className="bg-[#6536DD] border-2 border-black"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 4,
              }}
            >
              <View className="bg-[#6536DD] px-6 py-3">
                <Text className="text-white font-pbold text-sm">Search Music</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const progressPercentage =
    currentTrack?.duration_ms && currentTrack.duration_ms > 0
      ? ((playbackState?.progress || 0) / currentTrack.duration_ms) * 100
      : 0;

  return (
    <View
      className={`w-full h-full shadow-2xl border-2 border-black rounded-lg overflow-hidden ${className}`}
    >
      <View className="relative">
        <RetroHeader title="SPOTIFY" />
        {/* Logout Button positioned on the left */}
        <TouchableOpacity
          onPress={disconnectSpotify}
          style={[
            styles.disconnectButton,
            {
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            },
          ]}
          className="bg-red-500 border-2 border-black"
        >
          <View className="bg-red-500 p-2">
            <Ionicons name="log-out-outline" size={16} color="white" />
          </View>
        </TouchableOpacity>

        {/* Delete Button positioned on the right - only show if onPress is provided */}
        {onPress && (
          <TouchableOpacity
            onPress={handleRemoveTrack}
            style={[
              styles.removeButton,
              {
                shadowColor: '#000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 4,
              },
            ]}
            className="bg-red-500 border-2 border-black"
          >
            <View className="bg-red-500 p-2">
              <Ionicons name="close" size={16} color="white" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View className="bg-white px-4 py-4 rounded-b-md flex-1">
        {/* Controller indicator */}
        {roomId && (
          <View className="flex-row items-center justify-center mb-2">
            <Ionicons name="radio" size={12} color="#6536DD" />
            <Text className="text-black font-pregular text-xs ml-1">
              {isController ? 'You control' : 'Partner controls'}
            </Text>
          </View>
        )}

        <View style={styles.container}>
          {/* Album Art */}
          <View style={styles.albumArtContainer}>
            <View style={styles.albumArtShadow}>
              <Image
                source={{ uri: currentTrack?.album_art_url || '' }}
                style={styles.albumArt}
                resizeMode="cover"
                onLoad={() =>
                  console.log(
                    '✅ [DEBUG] Album art loaded successfully:',
                    currentTrack?.album_art_url,
                  )
                }
                onError={(error) =>
                  console.error(
                    '❌ [DEBUG] Album art failed to load:',
                    error.nativeEvent,
                    'URL:',
                    currentTrack?.album_art_url,
                  )
                }
                defaultSource={require('@/assets/images/logo.png')}
              />
            </View>
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackName} numberOfLines={1}>
              {currentTrack?.track_name}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {currentTrack?.artist_name}
            </Text>
            <Text style={styles.albumName} numberOfLines={1}>
              {currentTrack?.album_name}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>
                {formatTime(Math.floor((playbackState?.progress || 0) / 1000))}
              </Text>
              <Text style={styles.timeText}>
                {formatTime(Math.floor((currentTrack?.duration_ms || 0) / 1000))}
              </Text>
            </View>
          </View>

          {/* Controls */}
          {canControl && (
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={skipToPrevious}
                style={[styles.controlButton, !canControl && styles.disabledButton]}
                disabled={!canControl}
              >
                <Ionicons name="play-skip-back" size={24} color={!canControl ? '#666' : 'white'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePlayPause}
                style={[styles.playButton, isLoading && styles.loadingButton]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingSpinner}>
                    <Ionicons name="refresh" size={24} color="white" style={styles.spinning} />
                  </View>
                ) : (
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="white" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={skipToNext}
                style={[styles.controlButton, !canControl && styles.disabledButton]}
                disabled={!canControl}
              >
                <Ionicons
                  name="play-skip-forward"
                  size={24}
                  color={!canControl ? '#666' : 'white'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    position: 'relative',
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  albumArt: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  albumArtShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  trackName: {
    color: 'black',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  artistName: {
    color: '#6536DD',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  albumName: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6536DD',
    borderRadius: 2,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    backgroundColor: '#6536DD',
    borderRadius: 30,
    padding: 12,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'black',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  disconnectButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },

  disabledButton: {
    opacity: 0.5,
  },
  loadingButton: {
    backgroundColor: '#666',
  },
  loadingSpinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
});
