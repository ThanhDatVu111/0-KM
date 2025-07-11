import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useSharedSpotifyTrack, SharedSpotifyTrack } from '../../hooks/useSharedSpotifyTrack';
import { useSpotifyPlayback } from '../../hooks/useSpotifyPlayback';
import { useSpotifyAuth } from '../../hooks/useSpotifyAuth';
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
  const {
    status: spotifyStatus,
    accessToken,
    connect: connectSpotify,
    disconnect: disconnectSpotify,
  } = useSpotifyAuth();
  const { track, updateTrack, clearTrack } = useSharedSpotifyTrack(roomId || null);
  const { playbackState, togglePlayPause, skipToNext, skipToPrevious } = useSpotifyPlayback();
  const [isPlaying, setIsPlaying] = useState(false);

  // Derive connection state from Supabase auth status
  const isConnected = spotifyStatus === 'connected';
  const isConnecting = spotifyStatus === 'connecting';

  // Always declare currentTrack at the top, before any return
  // Prioritize shared room track data, fallback to Spotify playback state
  const currentTrack =
    track ||
    (playbackState?.currentTrack
      ? {
          track_name: playbackState.currentTrack.name,
          artist_name: playbackState.currentTrack.artist,
          album_name: playbackState.currentTrack.album,
          album_art_url: playbackState.currentTrack.albumArt,
          duration_ms: playbackState.currentTrack.duration * 1000,
          track_uri: playbackState.currentTrack.uri,
        }
      : null);

  // Utility function to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update isPlaying state based on Spotify playback state
  useEffect(() => {
    if (playbackState) {
      setIsPlaying(playbackState.isPlaying);
    }
  }, [playbackState]);

  // Handle play/pause
  const handlePlayPause = async () => {
    if (!currentTrack?.track_uri) {
      return;
    }

    try {
      // Always use Spotify API directly for play/pause control
      await togglePlayPause();

      // Update local state after successful API call
      setIsPlaying(!isPlaying);
    } catch (error) {
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
  const hasAnyTrackData = track?.track_uri || (playbackState?.currentTrack?.uri && !track);

  if (!hasAnyTrackData) {
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

  // Determine if user is controlling the playback
  const isController = track?.controlled_by_user_id === userId;

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
