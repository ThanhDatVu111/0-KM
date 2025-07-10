import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/clerk-expo';
import { useSpotifyPlayback } from '../../hooks/useSpotifyPlayback';
import { useSharedPlayback } from '../../hooks/useSharedPlayback';
import { usePlaybackCommandListener } from '../../hooks/usePlaybackCommandListener';
import { apiClient } from '../../apis/apiClient';
import { sendPlaybackCommand } from '../../services/playbackCommands';
import { logger } from '../../utils/logger';
import { useRoomSpotifyTrack } from '../../hooks/useRoomSpotifyTrack';
import supabase from '../../utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import images from '@/constants/images';

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
  canControl?: boolean;
  onAddTrack?: () => void;
  onSignOut?: () => void;
  onDeleteTrack?: () => void;
  roomId?: string | null;
};

type SpotifyState = 'not-connected' | 'connected-no-track' | 'has-track' | 'token-expired';

export function UnifiedSpotifyWidget({
  track,
  onPress,
  className = '',
  canControl = false,
  onAddTrack,
  onSignOut,
  onDeleteTrack,
  roomId,
}: Props) {
  const { userId } = useAuth();
  const [spotifyState, setSpotifyState] = useState<SpotifyState>('not-connected');
  const [hasConnectedBefore, setHasConnectedBefore] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);

  // Get room track and playback state
  const { roomTrack, hasRoom } = useRoomSpotifyTrack();

  // Check if we have a valid Spotify session on mount and when session changes
  useEffect(() => {
    const checkSpotifyConnection = async () => {
      try {
        console.log('🔍 [DEBUG] Checking Supabase Spotify connection for user:', userId);

        // Check if user has a Spotify session in Supabase
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting Supabase session:', error);
          setSpotifyState('not-connected');
          return;
        }

        // Check if we have Spotify provider data
        const providers = session?.user?.app_metadata?.providers;
        const hasSpotifyProvider =
          providers && Array.isArray(providers) && providers.includes('spotify');
        console.log('🔍 [DEBUG] Full session data:', JSON.stringify(session, null, 2));
        console.log('🔍 [DEBUG] Session providers:', providers);
        console.log('🔍 [DEBUG] Has Spotify provider:', hasSpotifyProvider);

        if (hasSpotifyProvider) {
          console.log('✅ Spotify connected via Supabase OAuth');
          // Only update state if we're not in the middle of connecting
          if (!isConnecting) {
            // Check if we actually have a valid track (not just roomTrack exists)
            const hasValidTrack = track && track.id;
            const newState = hasValidTrack ? 'has-track' : 'connected-no-track';
            console.log(
              '🎵 [DEBUG] Connection check setting state to:',
              newState,
              'hasValidTrack:',
              hasValidTrack,
            );
            setSpotifyState(newState);
            setHasConnectedBefore(true);
          } else {
            console.log('🎵 [DEBUG] Connection check skipped - isConnecting is true');
          }
        } else {
          console.log('🔍 [DEBUG] No Spotify provider found - user needs to connect');
          // Only update state if we're not in the middle of connecting
          if (!isConnecting) {
            console.log('🎵 [DEBUG] Connection check setting state to not-connected');
            setSpotifyState('not-connected');
          } else {
            console.log('🎵 [DEBUG] Connection check skipped - isConnecting is true');
          }
        }
      } catch (error) {
        console.error('Error checking Spotify connection:', error);
        setSpotifyState('not-connected');
      }
    };

    checkSpotifyConnection();
  }, [roomTrack, userId, isConnecting, track]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 [DEBUG] Auth state changed:', event);
      // Check for any auth state change that might include session updates
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
        // Re-check Spotify connection when auth state changes
        const providers = session?.user?.app_metadata?.providers;
        const hasSpotifyProvider =
          providers && Array.isArray(providers) && providers.includes('spotify');
        console.log('🔍 [DEBUG] Auth change - providers:', providers);
        console.log('🔍 [DEBUG] Auth change - has Spotify:', hasSpotifyProvider);

        if (hasSpotifyProvider) {
          // Only update state if we're not in the middle of connecting
          if (!isConnecting) {
            // Check if we actually have a valid track (not just roomTrack exists)
            const hasValidTrack = track && track.id;
            const newState = hasValidTrack ? 'has-track' : 'connected-no-track';
            console.log(
              '🎵 [DEBUG] Auth change setting state to:',
              newState,
              'hasValidTrack:',
              hasValidTrack,
            );
            setSpotifyState(newState);
            setHasConnectedBefore(true);
          } else {
            console.log('🎵 [DEBUG] Auth change skipped - isConnecting is true');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🎵 [DEBUG] Auth change setting state to not-connected (signed out)');
          setSpotifyState('not-connected');
          setHasConnectedBefore(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [roomTrack, isConnecting, track]);

  // Real Spotify playback controls
  const {
    playbackState: localPlaybackState,
    isLoading: playbackLoading,
    error: playbackError,
    togglePlayPause,
    playTrack,
    skipToNext,
    skipToPrevious,
    setVolume,
    seekToPosition,
  } = useSpotifyPlayback();

  // Shared playback controls (for room sync)
  const {
    sharedPlaybackState: sharedPlaybackState,
    isLoading: sharedLoading,
    togglePlayPause: sharedTogglePlayPause,
    playTrack: sharedPlayTrack,
    skipToNext: sharedSkipToNext,
    skipToPrevious: sharedSkipToPrevious,
  } = useSharedPlayback(roomId || null);

  // Use shared playback if in a room, otherwise use local
  const isInRoom = !!roomId;
  const currentPlaybackState = isInRoom ? sharedPlaybackState : localPlaybackState;
  const isLoading = isInRoom ? sharedLoading : playbackLoading;

  // Mirror action approach: send commands to backend instead of direct Spotify calls
  const handleTogglePlayPause = async () => {
    if (!isInRoom || !roomId || !userId) {
      // Fallback to local playback if not in room
      await togglePlayPause();
      return;
    }

    try {
      const isCurrentlyPlaying =
        (currentPlaybackState as any)?.is_playing || (currentPlaybackState as any)?.isPlaying;

      if (isCurrentlyPlaying) {
        // If playing, pause
        await sendPlaybackCommand(roomId, { command: 'pause' }, userId, apiClient);
      } else {
        // If paused and we have a track, play it
        if (track) {
          await sendPlaybackCommand(
            roomId,
            {
              command: 'play',
              track_uri: track.uri,
              position_ms: 0,
            },
            userId,
            apiClient,
          );
        } else {
          // Just toggle play/pause without specific track
          await sendPlaybackCommand(roomId, { command: 'play' }, userId, apiClient);
        }
      }
    } catch (error) {
      logger.spotify.error('Error sending play/pause command:', error);
      // Fallback to local playback
      await togglePlayPause();
    }
  };

  const handleSkipToNext = async () => {
    if (!isInRoom || !roomId || !userId) {
      await skipToNext();
      return;
    }

    try {
      await sendPlaybackCommand(roomId, { command: 'next' }, userId, apiClient);
    } catch (error) {
      logger.spotify.error('Error sending next command:', error);
      await skipToNext();
    }
  };

  const handleSkipToPrevious = async () => {
    if (!isInRoom || !roomId || !userId) {
      await skipToPrevious();
      return;
    }

    try {
      await sendPlaybackCommand(roomId, { command: 'previous' }, userId, apiClient);
    } catch (error) {
      logger.spotify.error('Error sending previous command:', error);
      await skipToPrevious();
    }
  };

  const handlePlayTrack = async (trackUri: string) => {
    if (!isInRoom || !roomId || !userId) {
      await playTrack(trackUri);
      return;
    }

    try {
      await sendPlaybackCommand(
        roomId,
        {
          command: 'play',
          track_uri: trackUri,
          position_ms: 0,
        },
        userId,
        apiClient,
      );
    } catch (error) {
      logger.spotify.error('Error sending play track command:', error);
      await playTrack(trackUri);
    }
  };

  // Set up command listener for controller (User 1)
  const isController = sharedPlaybackState?.controlled_by_user_id === userId;
  usePlaybackCommandListener(roomId || '', isController);

  // Handle track changes - update state when track is added/removed
  useEffect(() => {
    console.log(
      '🎵 [DEBUG] Track change effect - track:',
      !!track,
      'spotifyState:',
      spotifyState,
      'hasConnectedBefore:',
      hasConnectedBefore,
    );
    if (track && spotifyState !== 'has-track') {
      console.log('🎵 [DEBUG] Setting state to has-track');
      setSpotifyState('has-track');
    } else if (!track && hasConnectedBefore && spotifyState === 'has-track') {
      console.log('🎵 [DEBUG] Setting state to connected-no-track');
      setSpotifyState('connected-no-track');
    }
  }, [track, hasConnectedBefore, spotifyState]);

  const handleSignOutSpotify = async () => {
    try {
      // Sign out from Spotify provider in Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out from Spotify:', error);
        Alert.alert('Error', 'Failed to disconnect from Spotify');
        return;
      }

      setSpotifyState('not-connected');
      setHasConnectedBefore(false);

      if (onSignOut) {
        onSignOut();
      }

      Alert.alert('Success', 'Disconnected from Spotify');
    } catch (error) {
      console.error('Error signing out from Spotify:', error);
      Alert.alert('Error', 'Failed to disconnect from Spotify');
    }
  };

  const handleReconnectSpotify = async () => {
    // Reset state and trigger reconnection
    setSpotifyState('not-connected');
    setHasConnectedBefore(false);
    await handleConnectSpotify();
  };

  const handleConnectSpotify = async () => {
    try {
      console.log('🔗 [DEBUG] Starting Supabase Spotify OAuth for user:', userId);
      console.log('🔗 [DEBUG] Button pressed - handleConnectSpotify called');
      setIsConnecting(true);

      // Generate the correct redirect URI using custom scheme
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: '0km-app',
      });
      console.log('🔗 Redirect URI:', redirectUri); // should log: 0km-app://

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
          redirectTo: redirectUri,
        },
      });

      console.log('🔗 [DEBUG] Supabase OAuth response:', { data, error });
      console.log('🔗 [DEBUG] OAuth URL that should open:', data?.url);

      if (error) {
        console.error('Supabase OAuth error:', error);
        Alert.alert('Error', 'Failed to connect to Spotify. Please try again.');
        return;
      }

      // Open the OAuth URL in browser
      if (data?.url) {
        console.log('🔗 [DEBUG] Opening OAuth URL in browser:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        console.log('🔗 [DEBUG] Browser result:', result);

        if (result.type === 'success') {
          console.log('✅ [DEBUG] OAuth completed successfully');
          console.log('🔗 [DEBUG] Final URL:', result.url);

          // Process the OAuth callback
          try {
            // Extract tokens from the URL
            const url = new URL(result.url);
            const accessToken = url.hash.match(/access_token=([^&]*)/)?.[1];
            const refreshToken = url.hash.match(/refresh_token=([^&]*)/)?.[1];
            const providerToken = url.hash.match(/provider_token=([^&]*)/)?.[1];

            console.log('🔗 [DEBUG] Extracted tokens:', {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              hasProviderToken: !!providerToken,
            });

            if (accessToken && refreshToken) {
              // Set the session with the new tokens
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error('❌ [DEBUG] Error setting session:', sessionError);
              } else {
                console.log('✅ [DEBUG] Session updated successfully');
                console.log(
                  '🔍 [DEBUG] New session providers:',
                  sessionData.session?.user?.app_metadata?.providers,
                );

                // Force a session refresh to get the latest provider data
                const { data: refreshedSession } = await supabase.auth.getSession();
                console.log(
                  '🔍 [DEBUG] Refreshed session providers:',
                  refreshedSession.session?.user?.app_metadata?.providers,
                );

                // Set the connection status immediately
                setHasConnectedBefore(true);
                const newState = roomTrack ? 'has-track' : 'connected-no-track';
                console.log('🔗 [DEBUG] Setting Spotify state to:', newState);
                setSpotifyState(newState);

                Alert.alert('Success!', 'Spotify connected successfully!');
              }
            } else {
              console.error('❌ [DEBUG] Missing tokens in callback URL');
              Alert.alert('Error', 'Failed to get access tokens from Spotify');
            }
          } catch (callbackError) {
            console.error('❌ [DEBUG] Error processing OAuth callback:', callbackError);
            Alert.alert('Error', 'Failed to process Spotify connection');
          }
        } else if (result.type === 'cancel') {
          console.log('❌ [DEBUG] User cancelled OAuth');
        } else {
          console.log('❌ [DEBUG] OAuth failed:', result);
        }
      } else {
        console.error('❌ [DEBUG] No OAuth URL received from Supabase');
        Alert.alert('Error', 'No OAuth URL received. Please try again.');
      }
    } catch (error) {
      logger.spotify.error('Error connecting to Spotify via Supabase:', error);
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

  // Debug logging for state
  console.log(
    '🎵 [DEBUG] Rendering Spotify widget with state:',
    spotifyState,
    'hasConnectedBefore:',
    hasConnectedBefore,
    'track:',
    !!track,
    'isConnecting:',
    isConnecting,
  );

  // Render different states
  if (spotifyState === 'not-connected') {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="SPOTIFY" />
        <View className="bg-white flex-1 rounded-b-md">
          <View className="px-4 pt-0 pb-2 flex-1 justify-center items-center">
            <Ionicons name="musical-notes" size={24} color="#6536DD" />
            <Text className="font-pmedium text-sm text-black mt-2 mb-3 text-center">
              {isConnecting ? 'Connecting to Spotify...' : 'Connect Spotify'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                console.log('🔗 [DEBUG] Connect button pressed');
                Alert.alert('Test', 'Connect button pressed!');
                handleConnectSpotify();
              }}
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
              <View className="bg-[#6536DD] px-4 py-2">
                <Text className="text-white font-pmedium text-sm">
                  {isConnecting ? 'CONNECTING...' : 'CONNECT'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (spotifyState === 'connected-no-track') {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="SPOTIFY" />
        <View className="bg-white flex-1 rounded-b-md relative">
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

          <View className="items-center justify-center pt-0 pb-2 px-4 flex-1">
            <Ionicons name="musical-notes" size={24} color="#6536DD" />
            <Text className="font-pmedium text-sm mt-2 text-black text-center">
              No Music in Room
            </Text>
            <TouchableOpacity
              onPress={onAddTrack}
              className="bg-[#6536DD] border-2 border-black mt-3"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 4,
              }}
            >
              <View className="bg-[#6536DD] px-4 py-2 flex-row items-center">
                <Ionicons name="add" size={16} color="white" />
                <Text className="text-white font-pmedium text-sm ml-1">ADD TRACK</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (spotifyState === 'token-expired') {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="SPOTIFY" />
        <View className="bg-white flex-1 rounded-b-md">
          <View className="items-center justify-center pt-0 pb-2 px-4 flex-1">
            <Ionicons name="warning" size={24} color="#6536DD" />
            <Text className="font-pmedium text-sm mt-2 text-black text-center">
              Connection Expired
            </Text>
            <TouchableOpacity
              onPress={handleReconnectSpotify}
              disabled={isConnecting}
              className="bg-[#6536DD] border-2 border-black mt-3"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 4,
              }}
            >
              <View className="bg-[#6536DD] px-4 py-2">
                <Ionicons name="refresh" size={16} color="white" />
                <Text className="text-white font-pmedium text-sm ml-1">
                  {isConnecting ? 'RECONNECTING...' : 'RECONNECT'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Has track - show the full Spotify widget
  if (!track) {
    // If we're connected but have no track, we should have already returned above
    // This is a fallback for edge cases
    return null;
  }

  return (
    <View
      className={`w-full h-full shadow-2xl border-2 border-black rounded-lg overflow-hidden ${className}`}
    >
      <RetroHeader title="SPOTIFY" />
      <View className="bg-white flex-1 rounded-b-md">
        <View className="px-4 pt-1 pb-4 flex-1">
          <View style={styles.container}>
            {/* Album Art */}
            <View style={styles.albumArtContainer}>
              <View style={styles.albumArtShadow}>
                <Image
                  source={{ uri: track.albumArt }}
                  style={styles.albumArt}
                  resizeMode="cover"
                />
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
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: currentPlaybackState
                        ? `${((currentPlaybackState as any).progress / ((currentPlaybackState as any).currentTrack?.duration || 1)) * 1000 * 100}%`
                        : `${progressPercentage}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.timeInfo}>
                <Text style={styles.timeText}>
                  {currentPlaybackState
                    ? formatTime(Math.floor((currentPlaybackState as any).progress / 1000))
                    : formatTime(currentTime)}
                </Text>
                <Text style={styles.timeText}>
                  {(currentPlaybackState as any)?.currentTrack?.duration ||
                    formatTime(track.duration)}
                </Text>
              </View>
            </View>

            {/* Controls */}
            {canControl && (
              <View style={styles.controls}>
                <TouchableOpacity
                  onPress={handleSkipToPrevious}
                  style={styles.controlButton}
                  disabled={isLoading}
                >
                  <Ionicons name="play-skip-back" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTogglePlayPause}
                  style={[styles.playButton, isLoading && { opacity: 0.5 }]}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={
                      isLoading
                        ? 'hourglass'
                        : (isInRoom && (currentPlaybackState as any)?.is_playing) ||
                            (!isInRoom && (currentPlaybackState as any)?.isPlaying)
                          ? 'pause'
                          : 'play'
                    }
                    size={32}
                    color="white"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSkipToNext}
                  style={styles.controlButton}
                  disabled={isLoading}
                >
                  <Ionicons name="play-skip-forward" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {/* Remove button overlay - only show if onPress is provided */}
            {onPress && (
              <TouchableOpacity
                onPress={() => {
                  logger.spotify.debug('Remove button pressed for track:', track.name);
                  onPress();
                }}
                style={styles.removeButton}
                className="bg-red-500/80 rounded-full p-2"
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            )}

            {/* Delete button - show if onDeleteTrack is provided */}
            {onDeleteTrack && (
              <TouchableOpacity
                onPress={() => {
                  logger.spotify.debug('Delete button pressed for track:', track.name);
                  onDeleteTrack();
                }}
                style={[styles.removeButton, { top: onPress ? 40 : 8 }]}
                className="bg-red-600/90 rounded-full p-2"
              >
                <Ionicons name="trash" size={16} color="white" />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    position: 'relative',
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  albumArt: {
    width: 60,
    height: 60,
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
    marginBottom: 8,
  },
  trackName: {
    color: 'black',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  artistName: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 1,
  },
  albumName: {
    color: '#666666',
    fontSize: 10,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#404040',
    borderRadius: 2,
    marginBottom: 4,
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
    color: '#666666',
    fontSize: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    padding: 4,
  },
  playButton: {
    backgroundColor: '#1DB954',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
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
  controllerIndicator: {
    position: 'absolute',
    top: 30,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  controllerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  autoPlayText: {
    color: '#1DB954',
    fontSize: 8,
    fontWeight: '400',
    marginLeft: 4,
    fontStyle: 'italic',
  },
});
