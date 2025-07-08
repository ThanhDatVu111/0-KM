import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/clerk-expo';

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
  isController?: boolean;
  controllerName?: string;
};

export function SpotifyWidget({
  track,
  onPress,
  className = '',
  isPlaying = false,
  onPlayPause,
  onNext,
  onPrevious,
  canControl = false,
  isController = false,
  controllerName,
}: Props) {
  const { userId } = useAuth();
  const [currentTime, setCurrentTime] = useState(0);

  if (!track) {
    console.log('🎵 SpotifyWidget: No track provided, showing empty state');
    return (
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
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
            zIndex: -1,
          }}
        />
        <View className="items-center justify-center py-6">
          <Ionicons name="musical-notes" size={32} color="white" />
          <Text className="text-white font-pmedium text-lg mt-2">No Music Playing</Text>
          <Text className="text-white/70 font-pregular text-sm text-center mt-2">
            Add a Spotify track to share with your partner
          </Text>
        </View>
      </View>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = track.duration > 0 ? (currentTime / track.duration) * 100 : 0;

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
        {controllerName && (
          <View style={styles.controllerIndicator}>
            <Ionicons name="radio" size={12} color="white" />
            <Text style={styles.controllerText}>
              {isController ? 'You control' : `${controllerName} controls`}
            </Text>
          </View>
        )}
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

            <TouchableOpacity
              onPress={() => {
                console.log('🎵 Play button pressed', {
                  track,
                  isPlaying,
                  canControl,
                  isController,
                  controllerName,
                });
                if (onPlayPause) onPlayPause();
              }}
              style={styles.playButton}
            >
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
});
