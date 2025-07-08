import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';
import { spotifyPlayback } from '../../services/SpotifyPlaybackService';
import supabase from '@/utils/supabase';

interface DebugInfo {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  tokenExpiry: string | null;
  isTokenExpired: boolean;
  spotifyConnectionStatus: string;
  currentPlaybackState: any;
}

export function SpotifyDebugPanel() {
  const { userId } = useAuth();
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
        } catch (error: any) {
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

  const reconnectSpotify = async () => {
    try {
      // Clear existing tokens first
      await SecureStore.deleteItemAsync('spotify_access_token');
      await SecureStore.deleteItemAsync('spotify_refresh_token');
      await SecureStore.deleteItemAsync('spotify_token_expiry');

      Alert.alert(
        'Reconnect Spotify',
        'Your Spotify connection has expired. Please reconnect to continue controlling music.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reconnect Now',
            onPress: () => {
              // This will trigger the Spotify connect flow in the main widget
              // The user will need to go back to the main screen and use the connect button
              Alert.alert(
                'Instructions',
                'Go back to the main screen and tap "Connect Spotify" to reconnect your account.',
                [{ text: 'OK' }],
              );
            },
          },
        ],
      );
      checkSpotifyStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to clear tokens for reconnection');
    }
  };

  const testTokenRefresh = async () => {
    try {
      await spotifyPlayback.initialize();
      const state = await spotifyPlayback.getPlaybackState();
      Alert.alert('Success', 'Token refresh successful!');
      checkSpotifyStatus();
    } catch (error: any) {
      Alert.alert('Error', `Token refresh failed: ${error.message}`);
    }
  };

  const listDevices = async () => {
    try {
      console.log('🔍 Checking devices for current user...');
      const devices = await spotifyPlayback.getDevices();
      console.log('🎧 Available Spotify devices:', devices);

      if (devices.length === 0) {
        Alert.alert(
          'No Devices Found',
          'This could be because:\n\n' +
            '• No devices are currently active\n' +
            "• Spotify isn't playing on any device\n" +
            "• You're not connected to Spotify\n" +
            '• Your Spotify account has no active devices\n\n' +
            'Try opening Spotify on your phone and playing some music, then try again.',
        );
      } else {
        const deviceList = devices
          .map((d) => `${d.name} (${d.type}) - ${d.is_active ? 'ACTIVE' : 'inactive'}`)
          .join('\n');

        Alert.alert('Available Devices', `Found ${devices.length} device(s):\n\n${deviceList}`);
      }
    } catch (error: any) {
      console.error('❌ Error getting devices:', error);
      Alert.alert('Error', 'Failed to get devices: ' + error.message);
    }
  };

  // Helper to transfer playback and play a specific track
  const transferAndPlayTrack = async () => {
    try {
      // 1. Get devices
      const devices = await spotifyPlayback.getDevices();
      if (!devices.length) {
        Alert.alert('No devices found', 'Open Spotify on your phone and try again.');
        return;
      }

      // For demo: pick the first active device, or the first device
      const device = devices.find((d) => d.is_active) || devices[0];
      const deviceId = device.id;
      console.log('🎧 Using device:', device);

      // 2. Transfer playback to the device
      const accessToken = await SecureStore.getItemAsync('spotify_access_token');
      if (!accessToken) {
        Alert.alert('Error', 'No Spotify access token found. Please reconnect Spotify.');
        return;
      }

      // Transfer playback to the device
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });
      console.log('🔄 Transferred playback to device:', device.name);

      // 3. Use a sample track URI for testing
      const sampleTrackUri = 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh'; // "Blinding Lights" by The Weeknd

      // 4. Play the track on the device
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [sampleTrackUri] }),
      });

      Alert.alert('Success', `Playing sample track on ${device.name}`);
      console.log('▶️ Playing sample track on device:', device.name);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to transfer and play: ' + error.message);
      console.error('❌ Transfer & Play error:', error);
    }
  };

  const ensureActiveDevice = async () => {
    try {
      console.log('🎵 [Debug] Ensuring active device for playback...');
      const devices = await spotifyPlayback.getDevices();

      if (devices.length === 0) {
        Alert.alert('No Devices Found', 'Open Spotify on your phone and try again.');
        return;
      }

      // Find an active device or use the first available
      const activeDevice = devices.find((d) => d.is_active) || devices[0];

      if (activeDevice) {
        console.log('🎵 [Debug] Transferring playback to device:', activeDevice.name);
        await spotifyPlayback.transferPlayback(activeDevice.id);
        Alert.alert('Success', `Playback transferred to ${activeDevice.name}`);
        console.log('🎵 [Debug] Playback transferred successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to transfer playback: ' + error.message);
      console.error('🎵 [Debug] Failed to transfer playback:', error);
    }
  };

  const testRealtimeSubscription = async () => {
    try {
      console.log('🧪 Testing real-time subscription...');

      // Get current room ID
      const { data: roomData, error: roomError } = await supabase
        .from('room')
        .select('room_id')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`)
        .eq('filled', true)
        .single();

      if (roomError || !roomData?.room_id) {
        Alert.alert('Error', 'No room found for testing');
        return;
      }

      const roomId = roomData.room_id;
      console.log('🧪 Testing with room ID:', roomId);

      // Test inserting a dummy record to trigger real-time event
      const { data, error } = await supabase
        .from('room_spotify_tracks')
        .insert({
          room_id: roomId,
          track_id: 'test-track-' + Date.now(),
          track_name: 'Test Track',
          artist_name: 'Test Artist',
          album_name: 'Test Album',
          album_art_url: 'https://example.com/test.jpg',
          duration_ms: 180000,
          track_uri: 'spotify:track:test',
          added_by_user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Test insert failed:', error);
        Alert.alert('Error', `Test insert failed: ${error.message}`);
        return;
      }

      console.log('✅ Test record inserted:', data);
      Alert.alert('Success', 'Test record inserted! Check console for real-time events.');

      // Clean up test record after 5 seconds
      setTimeout(async () => {
        try {
          await supabase.from('room_spotify_tracks').delete().eq('id', data.id);
          console.log('🧹 Test record cleaned up');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup test record:', cleanupError);
        }
      }, 5000);
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      Alert.alert('Error', `Test failed: ${error.message}`);
    }
  };

  const checkRealtimeStatus = async () => {
    try {
      console.log('🔍 Checking real-time status...');

      // Check if real-time is enabled for the table
      const { data, error } = await supabase
        .from('room_spotify_tracks')
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error('❌ Real-time check failed:', error);
        Alert.alert('Error', `Real-time check failed: ${error.message}`);
        return;
      }

      console.log('✅ Real-time check passed:', data);
      Alert.alert('Success', 'Real-time is working! Check console for details.');
    } catch (error: any) {
      console.error('❌ Real-time status check failed:', error);
      Alert.alert('Error', `Status check failed: ${error.message}`);
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
          {/* Current Issue Notice */}
          {debugInfo && !debugInfo.hasAccessToken && (
            <View className="bg-red-500/20 border border-red-500/50 rounded p-3 mb-3">
              <Text className="text-red-200 font-pmedium mb-2">⚠️ Spotify Connection Issue</Text>
              <Text className="text-red-200/80 text-sm">
                Your Spotify connection has expired. You need to reconnect to control music.
              </Text>
              <Text className="text-red-200/80 text-sm mt-1">
                Both users should reconnect their Spotify accounts.
              </Text>
            </View>
          )}

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

              <TouchableOpacity
                onPress={listDevices}
                className="bg-purple-500 rounded px-3 py-2 flex-1"
              >
                <Text className="text-white text-center font-pmedium">List Devices</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={transferAndPlayTrack}
                className="bg-yellow-500 rounded px-3 py-2 flex-1"
              >
                <Text className="text-white text-center font-pmedium">Transfer & Play Track</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={ensureActiveDevice}
                className="bg-green-500 rounded px-3 py-2 flex-1"
              >
                <Text className="text-white text-center font-pmedium">Ensure Active Device</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={clearTokens} className="bg-red-500 rounded px-3 py-2 mb-2">
              <Text className="text-white text-center font-pmedium">Clear All Tokens</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={reconnectSpotify}
              className="bg-orange-500 rounded px-3 py-2 mb-2"
            >
              <Text className="text-white text-center font-pmedium">🔗 Reconnect Spotify</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={testRealtimeSubscription}
              className="bg-purple-500 rounded px-3 py-2 mb-2"
            >
              <Text className="text-white text-center font-pmedium">🧪 Test Real-time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={checkRealtimeStatus}
              className="bg-indigo-500 rounded px-3 py-2"
            >
              <Text className="text-white text-center font-pmedium">🔍 Check Real-time Status</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
