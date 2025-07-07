import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  uri: string;
};

type Props = {
  track?: SpotifyTrack;
  onPress?: () => void;
  className?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  canControl?: boolean;
  onAddTrack?: () => void;
  onSignOut?: () => void;
};

type SpotifyState = 'not-connected' | 'connected-no-track' | 'has-track';

export function UnifiedSpotifyWidget({
  track,
  onPress,
  className = '',
  isPlaying = false,
  onPlayPause,
  onNext,
  onPrevious,
  canControl = false,
  onAddTrack,
  onSignOut,
}: Props) {
  const { userId } = useAuth();
  const [currentTime, setCurrentTime] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [spotifyState, setSpotifyState] = useState<SpotifyState>('not-connected');
  const [hasConnectedBefore, setHasConnectedBefore] = useState(false);

  // Determine the current state
  useEffect(() => {
    if (track) {
      setSpotifyState('has-track');
    } else if (hasConnectedBefore) {
      setSpotifyState('connected-no-track');
    } else {
      setSpotifyState('not-connected');
    }
  }, [track, hasConnectedBefore]);

  const refreshSpotifyToken = async (refreshToken: string) => {
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
        }).toString(),
      });

      const tokenData = await response.json();

      // Check for errors
      if (tokenData.error) {
        throw new Error(`Token refresh error: ${tokenData.error_description || tokenData.error}`);
      }

      // Store new tokens (ensure all values are strings)
      await SecureStore.setItemAsync('spotify_access_token', tokenData.access_token || '');
      await SecureStore.setItemAsync(
        'spotify_token_expiry',
        (Date.now() + (tokenData.expires_in || 3600) * 1000).toString(),
      );

      return tokenData.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  };

  const getValidAccessToken = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('spotify_access_token');
      const refreshToken = await SecureStore.getItemAsync('spotify_refresh_token');
      const tokenExpiry = await SecureStore.getItemAsync('spotify_token_expiry');

      if (!accessToken || !refreshToken) {
        return null;
      }

      // Check if token is expired
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        // Token expired, refresh it
        return await refreshSpotifyToken(refreshToken);
      }

      return accessToken;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  };

  const handleSignOutSpotify = async () => {
    // Clear stored tokens
    await SecureStore.deleteItemAsync('spotify_access_token');
    await SecureStore.deleteItemAsync('spotify_refresh_token');
    await SecureStore.deleteItemAsync('spotify_token_expiry');

    setSpotifyState('not-connected');
    setHasConnectedBefore(false);

    if (onSignOut) {
      onSignOut();
    }
  };

  const handleConnectSpotify = async () => {
    try {
      setIsConnecting(true);

      // Clear any existing WebBrowser sessions
      await WebBrowser.coolDownAsync();

      // Create the redirect URI using Expo's AuthSession
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: '0km-app',
      });

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

      // Create the Spotify authorization URL with unique state to prevent caching
      const clientId = 'f805d2782059483e801da7782a7e04c8';
      const uniqueState = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=${uniqueState}&prompt=consent&show_dialog=true`;

      console.log('🔗 Auth URL:', authUrl);

      // Open the Spotify authorization URL in a web browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success') {
        // Extract the authorization code from the URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          console.log('✅ Got authorization code:', code);

          // Exchange the code for access tokens
          try {
            const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                  'Basic ' +
                  btoa('f805d2782059483e801da7782a7e04c8:06b28132afaf4c0b9c1f3224c268c35b'),
              },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
              }).toString(),
            });

            const tokenData = await tokenResponse.json();
            console.log('🎵 Spotify tokens:', tokenData);

            // Check if we got an error response
            if (tokenData.error) {
              throw new Error(
                `Spotify API Error: ${tokenData.error_description || tokenData.error}`,
              );
            }

            // Store tokens securely (ensure all values are strings)
            await SecureStore.setItemAsync('spotify_access_token', tokenData.access_token || '');
            await SecureStore.setItemAsync('spotify_refresh_token', tokenData.refresh_token || '');
            await SecureStore.setItemAsync(
              'spotify_token_expiry',
              (Date.now() + (tokenData.expires_in || 3600) * 1000).toString(),
            );

            // Update state to connected
            setSpotifyState('connected-no-track');
            setHasConnectedBefore(true);

            Alert.alert(
              'Success!',
              'Spotify connected successfully! You can now add tracks to your room.',
              [{ text: 'OK' }],
            );
          } catch (tokenError) {
            console.error('Error exchanging code for tokens:', tokenError);
            Alert.alert('Error', 'Failed to get access tokens. Please try again.');
          }
        } else {
          Alert.alert('Error', 'Failed to get authorization code from Spotify');
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled Spotify authorization');
      } else {
        Alert.alert('Error', 'Failed to connect to Spotify');
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      Alert.alert('Error', 'Failed to connect to Spotify. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = track && track.duration > 0 ? (currentTime / track.duration) * 100 : 0;

  // Render different states
  if (spotifyState === 'not-connected') {
    return (
      <View
        className={`border border-white/20 bg-white/10 shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
        style={{ borderWidth: 1.5 }}
      >
        <LinearGradient
          colors={['#6536DA', '#F7BFF7']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            zIndex: -1,
            opacity: 0.3,
          }}
        />
        <TouchableOpacity
          onPress={handleConnectSpotify}
          disabled={isConnecting}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1">
            <Ionicons name="musical-notes" size={24} color="white" />
            <View className="ml-3 flex-1">
              <Text className="text-white font-pmedium text-base">
                {isConnecting ? 'Connecting to Spotify...' : 'Connect Spotify'}
              </Text>
              <Text className="text-white/70 font-pregular text-sm">
                Connect your Spotify account to add music to your room
              </Text>
            </View>
          </View>
          <Ionicons name={isConnecting ? 'hourglass' : 'chevron-forward'} size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  if (spotifyState === 'connected-no-track') {
    return (
      <View
        className={`border border-white/20 bg-white/10 shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
        style={{ borderWidth: 1.5 }}
      >
        <LinearGradient
          colors={['#6536DA', '#F7BFF7']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            zIndex: -1,
            opacity: 0.3,
          }}
        />

        {/* Sign Out Button - Top Right */}
        <TouchableOpacity
          onPress={handleSignOutSpotify}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
          }}
          className="bg-red-500/80 rounded-full p-2"
        >
          <Ionicons name="log-out-outline" size={16} color="white" />
        </TouchableOpacity>

        <View className="items-center justify-center py-6">
          <Ionicons name="musical-notes" size={32} color="white" />
          <Text className="text-white font-pmedium text-lg mt-2">No Music in Room</Text>
          <Text className="text-white/70 font-pregular text-sm text-center mt-2 mb-4">
            Add a Spotify track to share with your partner
          </Text>
          <TouchableOpacity
            onPress={onAddTrack}
            className="bg-white/20 rounded-full px-6 py-3 flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-pmedium ml-2">Add Track</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Has track - show the full Spotify widget
  if (!track) return null;

  return (
    <View
      className={`border border-black bg-white/10 shadow-md backdrop-blur-lg overflow-hidden rounded-2xl ${className}`}
      style={{ borderWidth: 1.5 }}
    >
      <LinearGradient
        colors={['#1DB954', '#1ed760']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          zIndex: -1,
        }}
      />

      {/* Spotify Logo */}
      <View style={styles.spotifyLogo}>
        <Ionicons name="musical-notes" size={20} color="white" />
        <Text style={styles.spotifyText}>Spotify</Text>
      </View>

      <View style={styles.container}>
        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          <View style={styles.albumArtShadow}>
            <Image source={{ uri: track.albumArt }} style={styles.albumArt} resizeMode="cover" />
          </View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {track.artist}
          </Text>
          <Text style={styles.albumName} numberOfLines={1}>
            {track.album}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(track.duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        {canControl && (
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={onPrevious}
              style={styles.controlButton}
              disabled={!onPrevious}
            >
              <Ionicons name="play-skip-back" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onNext} style={styles.controlButton} disabled={!onNext}>
              <Ionicons name="play-skip-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Remove button overlay - only show if onPress is provided */}
        {onPress && (
          <TouchableOpacity
            onPress={onPress}
            style={styles.removeButton}
            className="bg-red-500/80 rounded-full p-2"
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        )}

        {/* Sign Out Button - Top Left (when there's a remove button) */}
        <TouchableOpacity
          onPress={handleSignOutSpotify}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
          }}
          className="bg-red-500/80 rounded-full p-2"
        >
          <Ionicons name="log-out-outline" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    backgroundColor: '#000',
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
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  artistName: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  albumName: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#b3b3b3',
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
    backgroundColor: '#1DB954',
    borderRadius: 30,
    padding: 12,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  spotifyLogo: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  spotifyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
