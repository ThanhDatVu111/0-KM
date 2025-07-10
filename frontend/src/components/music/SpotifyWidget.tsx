import React, { useState } from 'react';
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
import { useAuth } from '@clerk/clerk-expo';
import { useSpotifyAuth } from '../../hooks/useSpotifyAuth';
import { useSharedSpotifyTrack, SharedSpotifyTrack } from '../../hooks/useSharedSpotifyTrack';
import { useSpotifyPlayback } from '../../hooks/useSpotifyPlayback';
import { spotifyService } from '../../services/spotifyService';
import widgetBg from '@/assets/images/widget.png';

type Props = {
  roomId?: string;
  onPress?: () => void;
  className?: string;
  canControl?: boolean;
  isLoading?: boolean;
};

export function SpotifyWidget({
  roomId,
  onPress,
  className = '',
  canControl = false,
  isLoading = false,
}: Props) {
  const { userId } = useAuth();
  const { status, connect, disconnect } = useSpotifyAuth();
  const { track, updateTrack, clearTrack } = useSharedSpotifyTrack(roomId || null);
  const { playbackState, togglePlayPause, skipToNext, skipToPrevious } = useSpotifyPlayback();
  const [isPlaying, setIsPlaying] = useState(false);

  // Determine if user is controlling the playback
  const isController = track?.controlled_by_user_id === userId;

  // Handle play/pause
  const handlePlayPause = async () => {
    if (!track?.track_uri) return;

    try {
      if (roomId) {
        // In room mode - update shared state
        await updateTrack({ is_playing: !isPlaying });
        setIsPlaying(!isPlaying);
      } else {
        // Individual mode - use Spotify API directly
        await togglePlayPause();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
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
  if (status !== 'connected') {
    return (
      <ImageBackground
        source={widgetBg}
        style={{ borderRadius: 16 }}
        className={`border border-black shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
      >
        <View className="items-center justify-center py-6">
          <Ionicons name="musical-notes" size={32} color="white" />
          <Text className="text-white font-pmedium text-lg mt-2">Connect to Spotify</Text>
          <Text className="text-white/70 font-pregular text-sm text-center mt-2">
            Connect your Spotify account to share music with your partner
          </Text>
          <TouchableOpacity
            onPress={connect}
            disabled={status === 'connecting'}
            className="bg-green-500 px-6 py-3 rounded-full mt-4"
          >
            <Text className="text-white font-pmedium">
              {status === 'connecting' ? 'Connecting...' : 'Connect Spotify'}
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  // State 2: Connected but no track
  if (!track?.track_uri) {
    return (
      <ImageBackground
        source={widgetBg}
        style={{ borderRadius: 16 }}
        className={`border border-black shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
      >
        <View className="items-center justify-center py-6">
          <Ionicons name="musical-notes" size={32} color="white" />
          <Text className="text-white font-pmedium text-lg mt-2">Add a Track</Text>
          <Text className="text-white/70 font-pregular text-sm text-center mt-2">
            Search for a song to share with your partner
          </Text>
          <TouchableOpacity onPress={onPress} className="bg-green-500 px-6 py-3 rounded-full mt-4">
            <Text className="text-white font-pmedium">Search Music</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  // State 3: Playing track
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage =
    track.duration_ms && track.duration_ms > 0
      ? ((playbackState?.progress || 0) / track.duration_ms) * 100
      : 0;

  return (
    <ImageBackground
      source={widgetBg}
      style={{ borderRadius: 16, borderWidth: 1.5 }}
      className={`border border-black shadow-md backdrop-blur-lg overflow-hidden rounded-2xl ${className}`}
    >
      {/* Spotify Logo */}
      <View style={styles.spotifyLogo}>
        <Ionicons name="musical-notes" size={20} color="white" />
        <Text style={styles.spotifyText}>Spotify</Text>
        {roomId && (
          <View style={styles.controllerIndicator}>
            <Ionicons name="radio" size={12} color="white" />
            <Text style={styles.controllerText}>
              {isController ? 'You control' : 'Partner controls'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.container}>
        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          <View style={styles.albumArtShadow}>
            <Image
              source={{ uri: track.album_art_url || '' }}
              style={styles.albumArt}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>
            {track.track_name}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {track.artist_name}
          </Text>
          <Text style={styles.albumName} numberOfLines={1}>
            {track.album_name}
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
              {formatTime(Math.floor((track.duration_ms || 0) / 1000))}
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
              <Ionicons name="play-skip-forward" size={24} color={!canControl ? '#666' : 'white'} />
            </TouchableOpacity>
          </View>
        )}

        {/* Remove button overlay - only show if onPress is provided */}
        {onPress && (
          <TouchableOpacity
            onPress={handleRemoveTrack}
            style={styles.removeButton}
            className="bg-red-500/80 rounded-full p-2"
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
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
