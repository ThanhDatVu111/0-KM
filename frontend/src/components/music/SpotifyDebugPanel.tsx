import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSpotifyPlayback } from '../../hooks/useSpotifyPlayback';
import * as SecureStore from 'expo-secure-store';

export function SpotifyDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const {
    playbackState,
    isLoading,
    error,
    playTrack,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    refresh,
  } = useSpotifyPlayback();

  const getDebugInfo = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('spotify_access_token');
      const refreshToken = await SecureStore.getItemAsync('spotify_refresh_token');
      const tokenExpiry = await SecureStore.getItemAsync('spotify_token_expiry');

      setDebugInfo({
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        tokenExpiry: tokenExpiry ? new Date(parseInt(tokenExpiry)).toLocaleString() : 'None',
        isTokenExpired: tokenExpiry ? Date.now() > parseInt(tokenExpiry) : true,
        playbackState,
        isLoading,
        error,
      });
    } catch (err) {
      console.error('Error getting debug info:', err);
    }
  };

  const testPlayback = async () => {
    try {
      // Test with a popular track URI
      const testUri = 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh'; // "Blinding Lights" by The Weeknd
      await playTrack(testUri);
      Alert.alert('Test Playback', 'Attempted to play test track. Check your Spotify app!');
    } catch (err) {
      Alert.alert('Test Failed', `Error: ${err}`);
    }
  };

  if (!isVisible) {
    return (
      <TouchableOpacity
        onPress={() => {
          setIsVisible(true);
          getDebugInfo();
        }}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 10,
          borderRadius: 20,
        }}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>🔧 Debug</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderRadius: 10,
        padding: 15,
        maxHeight: 400,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          Spotify Debug Panel
        </Text>
        <TouchableOpacity onPress={() => setIsVisible(false)}>
          <Text style={{ color: 'white' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <Text style={{ color: 'white', fontSize: 14, marginBottom: 5 }}>
          Access Token: {debugInfo.hasAccessToken ? '✅' : '❌'}
        </Text>
        <Text style={{ color: 'white', fontSize: 14, marginBottom: 5 }}>
          Refresh Token: {debugInfo.hasRefreshToken ? '✅' : '❌'}
        </Text>
        <Text style={{ color: 'white', fontSize: 14, marginBottom: 5 }}>
          Token Expiry: {debugInfo.tokenExpiry || 'None'}
        </Text>
        <Text style={{ color: 'white', fontSize: 14, marginBottom: 5 }}>
          Token Expired: {debugInfo.isTokenExpired ? '❌' : '✅'}
        </Text>
        <Text style={{ color: 'white', fontSize: 14, marginBottom: 5 }}>
          Loading: {isLoading ? '🔄' : '✅'}
        </Text>
        {error && (
          <Text style={{ color: 'red', fontSize: 14, marginBottom: 5 }}>Error: {error}</Text>
        )}
        {playbackState && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: 'white', fontSize: 14, marginBottom: 5 }}>
              Playing: {playbackState.isPlaying ? '▶️' : '⏸️'}
            </Text>
            {playbackState.currentTrack && (
              <Text style={{ color: 'white', fontSize: 12, marginBottom: 5 }}>
                Track: {playbackState.currentTrack.name}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
        <TouchableOpacity
          onPress={testPlayback}
          style={{ backgroundColor: '#1DB954', padding: 8, borderRadius: 5 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Test Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={togglePlayPause}
          style={{ backgroundColor: '#1DB954', padding: 8, borderRadius: 5 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Play/Pause</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={refresh}
          style={{ backgroundColor: '#1DB954', padding: 8, borderRadius: 5 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
