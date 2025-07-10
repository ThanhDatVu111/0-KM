import { useEffect, useState } from 'react';
import supabase from '../utils/supabase';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getSpotifyAuthUrl, exchangeSpotifyCode } from '../apis/spotify';

export type SpotifyAuthStatus = 'idle' | 'connecting' | 'connected' | 'error';

export function useSpotifyAuth() {
  const [status, setStatus] = useState<SpotifyAuthStatus>('idle');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check if user is already connected to Spotify
  const checkConnection = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Check for tokens in user metadata (backend OAuth flow)
      const spotifyAccessToken = session?.user?.user_metadata?.spotify_access_token;
      const spotifyTokenExpiry = session?.user?.user_metadata?.spotify_token_expiry;

      if (spotifyAccessToken && spotifyTokenExpiry && Date.now() < spotifyTokenExpiry) {
        setAccessToken(spotifyAccessToken);
        setStatus('connected');
        return true;
      }

      // Fallback: Check for Supabase OAuth provider
      const spotifyProvider = session?.user?.app_metadata?.providers?.spotify;
      if (spotifyProvider?.access_token) {
        setAccessToken(spotifyProvider.access_token);
        setStatus('connected');
        return true;
      }

      // Check for locally stored tokens (for users who connected before signing in)
      // This would be implemented with SecureStore or similar
      // For now, we'll just set to idle
      setStatus('idle');
      return false;
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      setStatus('error');
      return false;
    }
  };

  // Trigger OAuth flow (backend first, fallback to Supabase)
  const connect = async () => {
    setStatus('connecting');
    try {
      console.log('🔗 Starting Spotify OAuth flow...');

      // Try backend OAuth first
      try {
        console.log('🔗 Attempting backend OAuth...');
        const authResponse = await getSpotifyAuthUrl();
        console.log('🔗 Backend auth response:', authResponse);

        if (!authResponse || !authResponse.auth_url) {
          throw new Error('No auth URL received from backend');
        }

        // Test browser functionality first
        console.log('🔗 Testing browser functionality...');
        const testResult = await WebBrowser.openAuthSessionAsync(
          'https://www.google.com',
          'exp://fb4hvyo-anonymous-8081.exp.direct',
        );
        console.log('🔗 Test browser result:', testResult.type);

        // Open the auth URL in browser
        console.log('🔗 Opening browser with auth URL:', authResponse.auth_url);
        const result = await WebBrowser.openAuthSessionAsync(
          authResponse.auth_url,
          'exp://fb4hvyo-anonymous-8081.exp.direct',
        );

        console.log('🔗 Browser result:', {
          type: result.type,
          url: 'url' in result ? result.url : undefined,
        });

        if (result.type === 'success') {
          console.log('🔗 OAuth redirect successful, URL:', result.url);
          // Extract the authorization code from the URL
          const url = new URL(result.url);
          const code = url.searchParams.get('code');

          if (code) {
            console.log('🔗 Got authorization code, exchanging for tokens...');
            // Exchange code for tokens via backend
            const tokenData = await exchangeSpotifyCode(code);
            console.log('🔗 Token exchange successful:', tokenData);

            // Try to store tokens in Supabase user metadata (if user is authenticated)
            try {
              const {
                data: { session },
              } = await supabase.auth.getSession();
              if (session?.user) {
                const { error } = await supabase.auth.updateUser({
                  data: {
                    spotify_access_token: tokenData.access_token,
                    spotify_refresh_token: tokenData.refresh_token,
                    spotify_token_expiry: Date.now() + tokenData.expires_in * 1000,
                  },
                });

                if (error) {
                  console.error('❌ Error storing tokens in Supabase:', error);
                  // Don't throw here - tokens are still valid for this session
                }
              } else {
                console.log('🔐 No Supabase session, storing tokens locally');
                // Store tokens in local storage or secure store for now
                // This will be handled when user signs in to the app
              }
            } catch (storageError) {
              console.error('❌ Error storing tokens:', storageError);
              // Don't throw here - tokens are still valid for this session
            }

            setAccessToken(tokenData.access_token);
            setStatus('connected');
            console.log('🔗 Spotify connected successfully!');
            return;
          } else {
            console.log('🔗 No authorization code found in redirect URL');
            throw new Error('No authorization code received from Spotify');
          }
        } else if (result.type === 'cancel') {
          console.log('🔗 OAuth was cancelled by user');
          setStatus('idle');
          return;
        } else {
          console.log('🔗 OAuth failed:', result.type);
          throw new Error(`OAuth failed: ${result.type}`);
        }
      } catch (backendError: any) {
        console.log('Backend OAuth failed, trying Supabase OAuth:', backendError);
        console.log('Backend error details:', {
          message: backendError?.message,
          stack: backendError?.stack,
          response: backendError?.response,
        });

        // Don't throw here, continue to Supabase OAuth fallback
      }

      // Fallback to Supabase OAuth
      console.log('🔄 Falling back to Supabase OAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
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
        console.error('❌ Supabase OAuth error:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error connecting to Spotify:', error);
      setStatus('error');
      Alert.alert('Error', 'Failed to connect to Spotify. Please try again.');
    }
  };

  // Disconnect from Spotify
  const disconnect = async () => {
    try {
      await supabase.auth.signOut();
      setStatus('idle');
      setAccessToken(null);
    } catch (error) {
      console.error('Error disconnecting from Spotify:', error);
    }
  };

  useEffect(() => {
    // Check initial connection status
    checkConnection();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check for backend OAuth tokens first
        const spotifyAccessToken = session.user?.user_metadata?.spotify_access_token;
        const spotifyTokenExpiry = session.user?.user_metadata?.spotify_token_expiry;

        if (spotifyAccessToken && spotifyTokenExpiry && Date.now() < spotifyTokenExpiry) {
          setAccessToken(spotifyAccessToken);
          setStatus('connected');
        } else {
          // Fallback: Check for Supabase OAuth provider
          const spotifyProvider = session.user?.app_metadata?.providers?.spotify;
          if (spotifyProvider?.access_token) {
            setAccessToken(spotifyProvider.access_token);
            setStatus('connected');
          } else {
            // Check if we have locally stored tokens to migrate
            // This would be implemented with SecureStore
            setStatus('idle');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setStatus('idle');
        setAccessToken(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Re-check connection status when tokens are refreshed
        checkConnection();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    status,
    accessToken,
    connect,
    disconnect,
    checkConnection,
  };
}
