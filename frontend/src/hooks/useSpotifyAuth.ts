import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import supabase from '../utils/supabase';

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

      console.log('🔍 [DEBUG] Checking connection - Session exists:', !!session);
      console.log('🔍 [DEBUG] Session user:', session?.user?.id);
      console.log(
        '🔍 [DEBUG] User metadata:',
        JSON.stringify(session?.user?.user_metadata, null, 2),
      );
      console.log('🔍 [DEBUG] App metadata:', JSON.stringify(session?.user?.app_metadata, null, 2));

      // Spotify provider tokens (Supabase v2)
      const spotifyProvider = session?.user.app_metadata?.providers?.spotify;
      if (spotifyProvider?.access_token) {
        console.log('🔗 Spotify OAuth tokens found in Supabase:', spotifyProvider);
        setAccessToken(spotifyProvider.access_token);
        setStatus('connected');
        return true;
      }

      // Fallback: legacy metadata tokens
      const spotifyAccessToken = session?.user.user_metadata?.spotify_access_token;
      const spotifyExpiry = session?.user.user_metadata?.spotify_token_expiry;
      if (spotifyAccessToken && spotifyExpiry && Date.now() < spotifyExpiry) {
        console.log('🔗 Legacy OAuth tokens found in metadata');
        setAccessToken(spotifyAccessToken);
        setStatus('connected');
        return true;
      }

      console.log('🔗 No Spotify tokens found');
      setStatus('idle');
      return false;
    } catch (err) {
      console.error('Error checking Spotify connection:', err);
      setStatus('error');
      return false;
    }
  };

  // Trigger Spotify OAuth flow via Supabase
  const connect = async () => {
    setStatus('connecting');
    try {
      // Generate redirect URI for Expo
      const redirectUri = AuthSession.makeRedirectUri();
      console.log('📎 Redirect URI:', redirectUri);

      // Start Supabase OAuth
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
          queryParams: { show_dialog: 'true' },
          redirectTo: redirectUri,
        },
      });

      if (error) {
        console.error('❌ Supabase OAuth error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No auth URL returned from Supabase');
      }

      console.log('👉 Opening browser for Spotify login...');
      console.log('🔗 Auth URL:', data.url);

      // Open browser for Spotify login and wait for redirect
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      console.log('🔁 OAuth flow result:', result);

      if (result.type === 'success' && result.url) {
        console.log('✅ OAuth successful, handling callback...');
        console.log('🔗 Callback URL:', result.url);

        // Parse the callback URL to extract tokens
        const url = new URL(result.url);
        const fragment = url.hash.substring(1); // Remove the # symbol
        const params = new URLSearchParams(fragment);

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const providerToken = params.get('provider_token');
        const providerRefreshToken = params.get('provider_refresh_token');

        console.log('🔗 Extracted tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasProviderToken: !!providerToken,
          hasProviderRefreshToken: !!providerRefreshToken,
        });

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('❌ Error setting session:', sessionError);
            throw new Error('Failed to set session');
          }

          console.log('🔗 Session set successfully');

          // Store Spotify provider tokens in user metadata
          if (providerToken && providerRefreshToken) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                spotify_access_token: providerToken,
                spotify_refresh_token: providerRefreshToken,
                spotify_token_expiry: Date.now() + 3600 * 1000, // 1 hour from now
              },
            });

            if (updateError) {
              console.error('❌ Error updating user metadata:', updateError);
            } else {
              console.log('🔗 Spotify tokens stored in user metadata');
            }
          }

          // Check if we're now connected
          const connected = await checkConnection();
          if (connected) {
            console.log('🔗 Successfully connected to Spotify!');
            setStatus('connected');
          } else {
            console.log('❌ OAuth completed but not connected');
            setStatus('error');
            Alert.alert('Error', 'OAuth completed but connection failed. Please try again.');
          }
        } else {
          console.error('❌ Missing tokens in callback URL');
          setStatus('error');
          Alert.alert('Error', 'Missing tokens in OAuth callback. Please try again.');
        }
      } else if (result.type === 'cancel') {
        console.log('❌ OAuth cancelled');
        setStatus('idle');
        Alert.alert('Cancelled', 'Spotify login was cancelled.');
      } else {
        console.error('❌ OAuth failed:', result);
        setStatus('error');
        Alert.alert('Error', 'Spotify login failed.');
      }

      // Close the web browser session
      WebBrowser.maybeCompleteAuthSession();
    } catch (err: any) {
      console.error('❌ OAuth error:', err);
      setStatus('error');
      Alert.alert('Error', err.message || 'Could not connect to Spotify');
    }
  };

  // Disconnect from Spotify / Supabase
  const disconnect = async () => {
    try {
      await supabase.auth.signOut();
      setStatus('idle');
      setAccessToken(null);
      Alert.alert('Success', 'Disconnected from Spotify');
    } catch (err) {
      console.error('Error during disconnect:', err);
      setStatus('idle');
      setAccessToken(null);
      Alert.alert('Success', 'Disconnected from Spotify');
    }
  };

  // Debug function to test Supabase configuration
  const debugSupabaseConfig = async () => {
    try {
      console.log('🔧 [DEBUG] Testing Supabase configuration...');

      // Check current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      console.log('🔧 [DEBUG] Current session:', session ? 'exists' : 'none');
      console.log('🔧 [DEBUG] Session error:', sessionError);

      if (session) {
        console.log('🔧 [DEBUG] User ID:', session.user.id);
        console.log('🔧 [DEBUG] User email:', session.user.email);
        console.log(
          '🔧 [DEBUG] User metadata:',
          JSON.stringify(session.user.user_metadata, null, 2),
        );
        console.log('🔧 [DEBUG] App metadata:', JSON.stringify(session.user.app_metadata, null, 2));
      }

      // Test OAuth URL generation
      const redirectUri = AuthSession.makeRedirectUri();
      console.log('🔧 [DEBUG] Redirect URI:', redirectUri);

      const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: redirectUri,
        },
      });

      console.log('🔧 [DEBUG] OAuth URL generation success:', !!oauthData?.url);
      console.log('🔧 [DEBUG] OAuth error:', oauthError);

      if (oauthData?.url) {
        console.log('🔧 [DEBUG] OAuth URL:', oauthData.url);
      }
    } catch (error) {
      console.error('🔧 [DEBUG] Configuration test error:', error);
    }
  };

  useEffect(() => {
    checkConnection();

    // Debug configuration on mount
    debugSupabaseConfig();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.id);
      if (event === 'SIGNED_IN') {
        console.log('🔄 User signed in, checking Spotify connection...');
        checkConnection();
      } else if (event === 'SIGNED_OUT') {
        console.log('🔄 User signed out');
        setStatus('idle');
        setAccessToken(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return { status, accessToken, connect, disconnect, checkConnection, debugSupabaseConfig };
}
