import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useCurrentTrack } from '@/hooks/useCurrentTrack';
import { spotifyService } from '@/services/spotifyService';

interface NowPlayingWidgetProps {
  className?: string;
}

export const NowPlayingWidget: React.FC<NowPlayingWidgetProps> = ({ className = '' }) => {
  const { isAuthenticated, authenticate, isLoading: authLoading } = useSpotifyAuth();
  const { currentTrack, isPlaying, isLoading } = useCurrentTrack();

  const handleConnectSpotify = async () => {
    await authenticate();
  };

  const handleTrackPress = () => {
    if (currentTrack) {
      spotifyService.openTrackInSpotify(currentTrack.uri);
    }
  };

  const getAlbumArt = () => {
    if (currentTrack?.album?.images && currentTrack.album.images.length > 0) {
      return currentTrack.album.images[0].url;
    }
    return undefined;
  };

  if (!isAuthenticated) {
    return (
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
      >
        <LinearGradient
          colors={['#6536DA', '#F7BFF7']}
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
          <Text className="text-white font-pmedium text-lg mt-2 mb-4">Connect Spotify</Text>
          <TouchableOpacity
            onPress={handleConnectSpotify}
            disabled={authLoading}
            className="bg-white/20 px-6 py-2 rounded-full"
          >
            {authLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-pmedium">Connect</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
      >
        <LinearGradient
          colors={['#6536DA', '#F7BFF7']}
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
          <ActivityIndicator color="white" size="large" />
          <Text className="text-white font-pmedium mt-2">Loading...</Text>
        </View>
      </View>
    );
  }

  if (!currentTrack) {
    return (
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
      >
        <LinearGradient
          colors={['#6536DA', '#F7BFF7']}
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
          <Ionicons name="pause-circle" size={32} color="white" />
          <Text className="text-white font-pmedium text-lg mt-2">Nothing Playing</Text>
          <Text className="text-white/70 font-pregular text-sm">
            Start playing music on Spotify
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleTrackPress}
      className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
    >
      <LinearGradient
        colors={['#6536DA', '#F7BFF7']}
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
      <View className="flex-row items-center">
        <Image
          source={{ uri: getAlbumArt() }}
          style={{ width: 60, height: 60, borderRadius: 8 }}
          defaultSource={require('@/assets/images/blue book.png')}
        />
        <View className="flex-1 ml-4">
          <Text className="text-white font-pmedium text-base" numberOfLines={1}>
            {currentTrack.name}
          </Text>
          <Text className="text-white/70 font-pregular text-sm" numberOfLines={1}>
            {currentTrack.artists.map((artist) => artist.name).join(', ')}
          </Text>
          <Text className="text-white/50 font-plight text-xs" numberOfLines={1}>
            {currentTrack.album.name}
          </Text>
        </View>
        <View className="items-center">
          <Ionicons name={isPlaying ? 'play-circle' : 'pause-circle'} size={24} color="white" />
          <Text className="text-white/70 font-plight text-xs mt-1">
            {isPlaying ? 'Playing' : 'Paused'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
