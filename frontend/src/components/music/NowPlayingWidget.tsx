import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useCurrentTrack } from '@/hooks/useCurrentTrack';
import { usePartnerTrack } from '@/hooks/usePartnerTrack';
import { spotifyService } from '@/services/spotifyService';

interface NowPlayingWidgetProps {
  className?: string;
}

export const NowPlayingWidget: React.FC<NowPlayingWidgetProps> = ({ className = '' }) => {
  const { isAuthenticated, authenticate, isLoading: authLoading } = useSpotifyAuth();
  const { currentTrack, isPlaying, isLoading } = useCurrentTrack();
  const { partnerTrack, hasRoom, isLoading: partnerLoading } = usePartnerTrack();

  const handleConnectSpotify = async () => {
    await authenticate();
  };

  const handleTrackPress = () => {
    if (currentTrack) {
      spotifyService.openTrackInSpotify(currentTrack.uri);
    } else if (partnerTrack) {
      spotifyService.openTrackInSpotify(partnerTrack.uri);
    }
  };

  const getAlbumArt = () => {
    if (currentTrack?.album?.images && currentTrack.album.images.length > 0) {
      return currentTrack.album.images[0].url;
    }
    if (partnerTrack?.album?.images && partnerTrack.album.images.length > 0) {
      return partnerTrack.album.images[0].url;
    }
    return undefined;
  };

  // If user is not authenticated, show connect prompt
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

  // If user is authenticated but no room, show their music or nothing playing
  if (!hasRoom) {
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
            <Ionicons name="time" size={32} color="white" />
            <Text className="text-white font-pmedium text-lg mt-2">No Recent Music</Text>
            <Text className="text-white/70 font-pregular text-sm">
              Start playing music on Spotify to see it here
            </Text>
          </View>
        </View>
      );
    }

    // Show user's recent track
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
            <Ionicons name="time" size={24} color="white" />
            <Text className="text-white/70 font-plight text-xs mt-1">Recently Played</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // User is authenticated and has a room - show partner's track or curiosity message
  if (partnerLoading) {
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
          <Text className="text-white font-pmedium mt-2">Loading partner's music...</Text>
        </View>
      </View>
    );
  }

  if (!partnerTrack) {
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
          <Ionicons name="heart" size={32} color="white" />
          <Text className="text-white font-pmedium text-lg mt-2">
            What's Your Partner Listening To?
          </Text>
          <Text className="text-white/70 font-pregular text-sm text-center mt-2">
            Curious about your partner's music taste? They'll appear here when they start playing
            something on Spotify!
          </Text>
        </View>
      </View>
    );
  }

  // Show partner's recent track
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
        <View className="relative">
          <Image
            source={{ uri: getAlbumArt() }}
            style={{ width: 60, height: 60, borderRadius: 8 }}
            defaultSource={require('@/assets/images/blue book.png')}
          />
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
            <Ionicons name="heart" size={12} color="white" />
          </View>
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-white font-pmedium text-base" numberOfLines={1}>
            {partnerTrack.name}
          </Text>
          <Text className="text-white/70 font-pregular text-sm" numberOfLines={1}>
            {partnerTrack.artists.map((artist) => artist.name).join(', ')}
          </Text>
          <Text className="text-white/50 font-plight text-xs" numberOfLines={1}>
            {partnerTrack.album.name}
          </Text>
        </View>
        <View className="items-center">
          <Ionicons name="time" size={24} color="white" />
          <Text className="text-white/70 font-plight text-xs mt-1">Recently Played</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
