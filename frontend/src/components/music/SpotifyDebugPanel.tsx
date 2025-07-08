import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { spotifyPlayback } from '../../services/SpotifyPlaybackService';

interface DebugInfo {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  tokenExpiry: string | null;
  isTokenExpired: boolean;
  spotifyConnectionStatus: string;
  currentPlaybackState: any;
}

export function SpotifyDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const checkSpotifyStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('spotify_access_token');
      const refreshToken = await SecureStore.getItemAsync('spotify_refresh_token');
      const tokenExpiry = await SecureStore.getItemAsync('spotify_token_expiry');

      const isTokenExpired = tokenExpiry ? Date.now() > parseInt(tokenExpiry) : true;

      let spotifyConnectionStatus = 'Unknown';
      let currentPlaybackState = null;

      if (accessToken && !isTokenExpired) {
        try {
          currentPlaybackState = await spotifyPlayback.getPlaybackState();
          spotifyConnectionStatus = 'Connected and working';
        } catch (error) {
          spotifyConnectionStatus = `Error: ${error.message}`;
        }
      } else if (isTokenExpired) {
        spotifyConnectionStatus = 'Token expired - needs refresh';
      } else {
        spotifyConnectionStatus = 'Not connected';
      }

      setDebugInfo({
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        tokenExpiry: tokenExpiry,
        isTokenExpired,
        spotifyConnectionStatus,
        currentPlaybackState,
      });
    } catch (error) {
      console.error('Error checking Spotify status:', error);
    }
  };

  const clearTokens = async () => {
    try {
      await SecureStore.deleteItemAsync('spotify_access_token');
      await SecureStore.deleteItemAsync('spotify_refresh_token');
      await SecureStore.deleteItemAsync('spotify_token_expiry');
      Alert.alert('Success', 'Spotify tokens cleared. Please reconnect your Spotify account.');
      checkSpotifyStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to clear tokens');
    }
  };

  const testTokenRefresh = async () => {
    try {
      await spotifyPlayback.initialize();
      const state = await spotifyPlayback.getPlaybackState();
      Alert.alert('Success', 'Token refresh successful!');
      checkSpotifyStatus();
    } catch (error) {
      Alert.alert('Error', `Token refresh failed: ${error.message}`);
    }
  };

  useEffect(() => {
    checkSpotifyStatus();
  }, []);

  if (!debugInfo) {
    return (
      <View className="bg-gray-800/50 rounded-lg p-4 m-4">
        <Text className="text-white">Loading debug info...</Text>
      </View>
    );
  }

  return (
    <View className="bg-gray-800/50 rounded-lg p-4 m-4">
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between"
      >
        <Text className="text-white font-pmedium text-lg">🔧 Spotify Debug Panel</Text>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="white" />
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView className="mt-4">
          <View className="space-y-3">
            {/* Token Status */}
            <View className="bg-gray-700/50 rounded p-3">
              <Text className="text-white font-pmedium mb-2">Token Status:</Text>
              <Text className="text-white/80 text-sm">
                Access Token: {debugInfo.hasAccessToken ? '✅ Present' : '❌ Missing'}
              </Text>
              <Text className="text-white/80 text-sm">
                Refresh Token: {debugInfo.hasRefreshToken ? '✅ Present' : '❌ Missing'}
              </Text>
              <Text className="text-white/80 text-sm">
                Expired: {debugInfo.isTokenExpired ? '❌ Yes' : '✅ No'}
              </Text>
              {debugInfo.tokenExpiry && (
                <Text className="text-white/80 text-sm">
                  Expires: {new Date(parseInt(debugInfo.tokenExpiry)).toLocaleString()}
                </Text>
              )}
            </View>

            {/* Connection Status */}
            <View className="bg-gray-700/50 rounded p-3">
              <Text className="text-white font-pmedium mb-2">Connection Status:</Text>
              <Text className="text-white/80 text-sm">{debugInfo.spotifyConnectionStatus}</Text>
            </View>

            {/* Current Playback */}
            {debugInfo.currentPlaybackState && (
              <View className="bg-gray-700/50 rounded p-3">
                <Text className="text-white font-pmedium mb-2">Current Playback:</Text>
                <Text className="text-white/80 text-sm">
                  Playing: {debugInfo.currentPlaybackState.isPlaying ? '✅ Yes' : '❌ No'}
                </Text>
                {debugInfo.currentPlaybackState.currentTrack && (
                  <>
                    <Text className="text-white/80 text-sm">
                      Track: {debugInfo.currentPlaybackState.currentTrack.name}
                    </Text>
                    <Text className="text-white/80 text-sm">
                      Artist: {debugInfo.currentPlaybackState.currentTrack.artist}
                    </Text>
                  </>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={checkSpotifyStatus}
                className="bg-blue-500 rounded px-3 py-2 flex-1"
              >
                <Text className="text-white text-center font-pmedium">Refresh Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={testTokenRefresh}
                className="bg-green-500 rounded px-3 py-2 flex-1"
              >
                <Text className="text-white text-center font-pmedium">Test Refresh</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={clearTokens} className="bg-red-500 rounded px-3 py-2">
              <Text className="text-white text-center font-pmedium">Clear All Tokens</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
