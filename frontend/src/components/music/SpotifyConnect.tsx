import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

interface Props {
  onConnected?: () => void;
}

export function SpotifyConnect({ onConnected }: Props) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectSpotify = async () => {
    try {
      setIsConnecting(true);

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

      // Create the Spotify authorization URL
      const clientId = 'f805d2782059483e801da7782a7e04c8';
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=state`;

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
              }),
            });

            const tokenData = await tokenResponse.json();
            console.log('🎵 Spotify tokens:', tokenData);

            // Store tokens securely
            await SecureStore.setItemAsync('spotify_access_token', tokenData.access_token);
            await SecureStore.setItemAsync('spotify_refresh_token', tokenData.refresh_token);
            await SecureStore.setItemAsync(
              'spotify_token_expiry',
              (Date.now() + (tokenData.expires_in || 3600) * 1000).toString(),
            );

            Alert.alert(
              'Success!',
              'Spotify connected successfully! You can now search and play real music!',
              [{ text: 'OK', onPress: onConnected }],
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

  return (
    <TouchableOpacity
      onPress={handleConnectSpotify}
      disabled={isConnecting}
      className="bg-white/10 rounded-2xl border border-white/20 p-4 mb-4"
    >
      <LinearGradient
        colors={['#1DB954', '#1ed760']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 16,
          opacity: 0.1,
        }}
      />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons name="musical-notes" size={24} color="#1DB954" />
          <View className="ml-3 flex-1">
            <Text className="text-white font-pmedium text-base">
              {isConnecting ? 'Connecting to Spotify...' : 'Connect Spotify'}
            </Text>
            <Text className="text-white/70 font-pregular text-sm">
              Connect your Spotify account to play real music
            </Text>
          </View>
        </View>

        <Ionicons name={isConnecting ? 'hourglass' : 'chevron-forward'} size={20} color="#1DB954" />
      </View>
    </TouchableOpacity>
  );
}
