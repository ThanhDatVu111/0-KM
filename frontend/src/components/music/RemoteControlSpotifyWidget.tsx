import React from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { SpotifyWidget } from './SpotifyWidget';
import { usePlaybackCommandListener } from '@/hooks/usePlaybackCommandListener';
import { usePlaybackState } from '@/hooks/usePlaybackState';
import { sendPlaybackCommand, sendPlayTrackCommand } from '@/services/playbackCommands';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface RemoteControlSpotifyWidgetProps {
  track?: {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    duration: number;
    uri: string;
  };
  roomId: string;
  isController: boolean;
  controllerName?: string;
  onPress?: () => void;
  onAddTrack?: () => void;
  className?: string;
}

export function RemoteControlSpotifyWidget({
  track,
  roomId,
  isController,
  controllerName,
  onPress,
  onAddTrack,
  className = '',
}: RemoteControlSpotifyWidgetProps) {
  // Set up command listener (only for controller)
  usePlaybackCommandListener(roomId, isController);

  // Get synchronized playback state
  const { state: playbackState, isLoading } = usePlaybackState(roomId);

  // Determine if music is playing based on shared state
  const isPlaying = playbackState?.is_playing || false;

  // Handle play/pause from non-controller
  const handlePlayPause = async () => {
    if (isController) {
      // Controller handles playback directly
      console.log('🎵 [Controller] Direct playback control');
      return;
    }

    // Non-controller sends command
    try {
      console.log('🎵 [Remote] Sending play/pause command');
      await sendPlaybackCommand(roomId, isPlaying ? 'pause' : 'play');
    } catch (error) {
      console.error('❌ [Remote] Failed to send command:', error);
      Alert.alert('Error', 'Failed to send playback command');
    }
  };

  // Handle next track from non-controller
  const handleNext = async () => {
    if (isController) {
      console.log('🎵 [Controller] Direct next control');
      return;
    }

    try {
      console.log('🎵 [Remote] Sending next command');
      await sendPlaybackCommand(roomId, 'next');
    } catch (error) {
      console.error('❌ [Remote] Failed to send next command:', error);
      Alert.alert('Error', 'Failed to send next command');
    }
  };

  // Handle previous track from non-controller
  const handlePrevious = async () => {
    if (isController) {
      console.log('🎵 [Controller] Direct previous control');
      return;
    }

    try {
      console.log('🎵 [Remote] Sending previous command');
      await sendPlaybackCommand(roomId, 'previous');
    } catch (error) {
      console.error('❌ [Remote] Failed to send previous command:', error);
      Alert.alert('Error', 'Failed to send previous command');
    }
  };

  // Handle playing a specific track
  const handlePlayTrack = async (trackUri: string) => {
    if (isController) {
      console.log('🎵 [Controller] Direct track play');
      return;
    }

    try {
      console.log('🎵 [Remote] Sending play track command:', trackUri);
      await sendPlayTrackCommand(roomId, trackUri);
    } catch (error) {
      console.error('❌ [Remote] Failed to send play track command:', error);
      Alert.alert('Error', 'Failed to send play track command');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <View className={`bg-white/10 rounded-2xl p-4 ${className}`}>
        <Text className="text-white text-center">Loading playback state...</Text>
      </View>
    );
  }

  // If no track, show add track button
  if (!track) {
    return (
      <View className={`bg-white/10 rounded-2xl border border-white/20 p-4 ${className}`}>
        <View className="items-center justify-center py-6">
          <Ionicons name="musical-notes" size={32} color="white" />
          <Text className="text-white font-pmedium text-lg mt-2">No Music Playing</Text>
          <Text className="text-white/70 font-pregular text-sm text-center mt-2">
            Add a Spotify track to share with your partner
          </Text>
          {onAddTrack && (
            <TouchableOpacity
              onPress={onAddTrack}
              className="bg-white/20 px-4 py-2 rounded-full mt-4"
            >
              <Text className="text-white font-pregular text-sm">+ Add Track</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Show controller status
  const statusText = isController
    ? 'You control playback'
    : controllerName
      ? `${controllerName} controls playback`
      : 'Partner controls playback';

  return (
    <View>
      {/* Controller Status */}
      <View className="mb-2">
        <Text className="text-white/80 text-sm text-center font-pregular">{statusText}</Text>
      </View>

      {/* Spotify Widget */}
      <SpotifyWidget
        track={track}
        isPlaying={isPlaying}
        canControl={true} // Both users can control (controller directly, non-controller via commands)
        isController={isController}
        controllerName={controllerName}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onPress={onPress}
        className={className}
      />

      {/* Debug Info (optional) */}
      {__DEV__ && (
        <View className="mt-2 p-2 bg-black/20 rounded">
          <Text className="text-white/60 text-xs">
            Room: {roomId} | Controller: {isController ? 'Yes' : 'No'} | Playing:{' '}
            {isPlaying ? 'Yes' : 'No'}
          </Text>
        </View>
      )}
    </View>
  );
}
