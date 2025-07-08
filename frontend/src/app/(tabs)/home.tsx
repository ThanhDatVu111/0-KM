import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import images from '@/constants/images';
import { SignOutButton } from '@/components/SignOutButton';
import { YouTubeWidget } from '@/components/music/YouTubeWidget';
import { YouTubeInput } from '@/components/music/YouTubeInput';
import { SpotifySearch } from '@/components/music/SpotifySearch';
import { SpotifyDebugPanel } from '@/components/music/SpotifyDebugPanel';
import { useRoomYouTubeVideo } from '@/hooks/useRoomYouTubeVideo';
import { useRoomSpotifyTrack } from '@/hooks/useRoomSpotifyTrack';
import { createRoomVideo, deleteRoomVideo } from '@/apis/youtube';
import { createRoomSpotifyTrack, deleteRoomSpotifyTrack } from '@/apis/spotify';
import { useApiClient } from '@/hooks/useApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotifyPlayback } from '@/hooks/useSpotifyPlayback';
import { UnifiedSpotifyWidget } from '@/components/music/UnifiedSpotifyWidget';

// WidgetCard component
const WidgetCard = ({
  children,
  className = '',
  noPadding = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) => (
  <View
    className={`border border-black bg-white/10 shadow-md backdrop-blur-lg ${noPadding ? '' : 'p-4'} ${className}`}
    style={{ borderWidth: 1.5, borderRadius: 16 }}
  >
    {children}
  </View>
);

const Home = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const apiClient = useApiClient();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showYouTubeInput, setShowYouTubeInput] = useState(false);
  const [showSpotifyInput, setShowSpotifyInput] = useState(false);

  const { roomVideo, hasRoom, isLoading: videoLoading, refetchRoomVideo } = useRoomYouTubeVideo();
  const {
    roomTrack,
    hasRoom: hasSpotifyRoom,
    isLoading: spotifyLoading,
    refetchRoomTrack,
  } = useRoomSpotifyTrack();

  // Real Spotify playback controls
  const { playTrack } = useSpotifyPlayback();
  const lastYouTubeDebugRef = useRef<string>('');

  // Debug logging (throttled)
  useEffect(() => {
    const debugKey = `${!!roomVideo}-${hasRoom}-${videoLoading}-${userId}`;
    if (lastYouTubeDebugRef.current !== debugKey) {
      console.log('🎬 Room YouTube Debug:', {
        roomVideo,
        hasRoom,
        videoLoading,
        userId,
      });
      lastYouTubeDebugRef.current = debugKey;
    }
  }, [roomVideo, hasRoom, videoLoading, userId]);

  useEffect(() => {
    if (userId) {
      loadUserRoom();
    }
  }, [userId]);

  const loadUserRoom = async () => {
    try {
      setIsLoading(true);
      const roomData = await fetchRoom({ user_id: userId! });

      if (roomData && roomData.room_id) {
        setRoomId(roomData.room_id);
        setIsHost(true);
      }
    } catch (error) {
      console.error('Failed to load user room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddYouTubeVideo = async (videoId: string) => {
    if (!userId) return;

    try {
      await createRoomVideo(
        {
          user_id: userId,
          video_id: videoId,
        },
        apiClient,
      );
      setShowYouTubeInput(false);
      // Refetch the room video to update the UI
      refetchRoomVideo();
    } catch (error) {
      console.error('Failed to add YouTube video:', error);
    }
  };

  const handleRemoveYouTubeVideo = async () => {
    if (!userId) return;

    try {
      await deleteRoomVideo(userId, apiClient);
    } catch (error) {
      console.error('Failed to remove YouTube video:', error);
    }
  };

  const handleAddSpotifyTrack = async (trackData: any) => {
    if (!userId) return;

    console.log('🎵 Adding Spotify track:', trackData);

    try {
      await createRoomSpotifyTrack(
        {
          user_id: userId,
          track_id: trackData.track_id,
          track_name: trackData.track_name,
          artist_name: trackData.artist_name,
          album_name: trackData.album_name,
          album_art_url: trackData.album_art_url,
          duration_ms: trackData.duration_ms,
          track_uri: trackData.track_uri,
        },
        apiClient,
      );
      console.log('✅ Track added to room successfully');
      setShowSpotifyInput(false);
      // Refetch the room track to update the UI
      console.log('🔄 Refetching room track...');
      await refetchRoomTrack();
      console.log('✅ Room track refetched');

      // Automatically play the track when added
      try {
        await playTrack(trackData.track_uri);
        console.log('🎵 Auto-playing track:', trackData.track_name);
        Alert.alert('Success!', `Now playing: ${trackData.track_name}`);
      } catch (playError) {
        console.error('Failed to auto-play track:', playError);
        Alert.alert(
          'Track Added',
          `${trackData.track_name} was added to your room, but couldn't start playing automatically. Make sure you have Spotify open on another device.`,
        );
      }
    } catch (error) {
      console.error('Failed to add Spotify track:', error);
      Alert.alert('Error', 'Failed to add track to room. Please try again.');
    }
  };

  const handleRemoveSpotifyTrack = async () => {
    if (!userId) return;

    try {
      await deleteRoomSpotifyTrack(userId, apiClient);
      refetchRoomTrack();
    } catch (error) {
      console.error('Failed to remove Spotify track:', error);
    }
  };

  const canAddVideo = hasRoom && (!roomVideo || roomVideo.added_by_user_id === userId);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#2A0D45]">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#F7BFF7', '#6536DA']} style={{ flex: 1 }}>
      {/* Full Screen Decoration Image */}
      <View className="absolute inset-0 opacity-100 z-0">
        <Image
          source={images.decoration}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 100, paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Widget Grid */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          {/* Calendar Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48 overflow-hidden" noPadding>
            <View
              style={{
                backgroundColor: '#6536DA',
                height: 48,
                justifyContent: 'center',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <Text className="font-psemibold text-lg text-white px-3">Friday 14</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-center font-pregular text-sm text-black px-3">
                Movie night in 3 days!
              </Text>
            </View>
          </WidgetCard>

          {/* Time Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48">
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
            <Text className="mb-2 font-pregular text-sm text-white">Alex's time</Text>
            <View className="flex-1 items-center justify-center">
              <Text className="font-pbold text-5xl text-white">9:30</Text>
            </View>
          </WidgetCard>
        </View>

        {/* Second row */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          {/* Weather Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48">
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
            <Text className="mb-2 font-pregular text-sm text-white">Alex's weather</Text>
            <View className="flex-1 items-center justify-center">
              <Text className="font-pbold text-5xl text-white">100F</Text>
            </View>
          </WidgetCard>

          {/* Image/Memory Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48 overflow-hidden" noPadding>
            <View style={{ flex: 1, position: 'relative' }}>
              <Image
                source={images.memory}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 16,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  padding: 8,
                }}
              >
                <Text className="font-pregular text-black text-sm">April 14th, 2025</Text>
                <Text className="font-plight text-black text-xs">Sunset view</Text>
              </View>
            </View>
          </WidgetCard>
        </View>

        {/* YouTube Music Widget */}
        <View className="mb-4">
          <Text className="text-lg text-white font-pmedium mb-3">
            {hasRoom ? "What We're Watching" : 'My Music Video'}
          </Text>
          {roomVideo ? (
            <YouTubeWidget
              videoId={roomVideo.video_id}
              onPress={roomVideo.added_by_user_id === userId ? handleRemoveYouTubeVideo : undefined}
            />
          ) : (
            <View className="h-32 bg-white/10 rounded-2xl border border-white/20 items-center justify-center">
              <Text className="text-white/70 font-pregular text-center px-4">
                {canAddVideo
                  ? 'No video playing. Tap + Add to start watching together!'
                  : 'Waiting for your partner to add a video...'}
              </Text>
              {canAddVideo && (
                <TouchableOpacity
                  onPress={() => setShowYouTubeInput(true)}
                  className="bg-white/20 px-3 py-1 rounded-full mt-2"
                >
                  <Text className="text-white font-pregular text-sm">+ Add</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Unified Spotify Widget */}
        <View className="mb-4">
          <Text className="text-lg text-white font-pmedium mb-3">
            {hasSpotifyRoom ? "What We're Listening To" : 'My Music'}
          </Text>

          <UnifiedSpotifyWidget
            track={
              roomTrack && roomTrack.track_id
                ? {
                    id: roomTrack.track_id,
                    name: roomTrack.track_name,
                    artist: roomTrack.artist_name,
                    album: roomTrack.album_name,
                    albumArt: roomTrack.album_art_url,
                    duration: Math.floor(roomTrack.duration_ms / 1000),
                    uri: roomTrack.track_uri,
                  }
                : undefined
            }
            roomId={roomId || null}
            canControl={true}
            onPress={roomTrack?.added_by_user_id === userId ? handleRemoveSpotifyTrack : undefined}
            onAddTrack={() => setShowSpotifyInput(true)}
          />
        </View>

        {/* Spotify Debug Panel */}
        <SpotifyDebugPanel />

        {/* Join Room Widget */}
        {!roomId && (
          <TouchableOpacity
            className="h-28 mt-4 items-center justify-center rounded-2xl border border-white/20 bg-primary/80 p-4 shadow-md backdrop-blur-lg"
            onPress={() => router.push('/(onboard)/join-room')}
          >
            <Text className="text-center font-pmedium text-lg text-white">
              + Join a room to connect with your partner +
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Sign Out Button - Top Right */}
      <View className="absolute top-16 right-5 z-50">
        <SignOutButton />
      </View>

      {/* YouTube Input Modal */}
      <Modal
        visible={showYouTubeInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYouTubeInput(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <YouTubeInput
            onVideoIdSubmit={handleAddYouTubeVideo}
            onCancel={() => setShowYouTubeInput(false)}
          />
        </View>
      </Modal>

      {/* Spotify Search Modal */}
      <Modal
        visible={showSpotifyInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSpotifyInput(false)}
      >
        <View className="flex-1 bg-black/90">
          <SpotifySearch
            onTrackSelect={(track) => {
              // Convert the track format to match your backend
              const trackData = {
                track_id: track.id,
                track_name: track.name,
                artist_name: track.artist,
                album_name: track.album,
                album_art_url: track.albumArt,
                duration_ms: track.duration * 1000,
                track_uri: track.uri,
              };

              handleAddSpotifyTrack(trackData);
            }}
            onCancel={() => setShowSpotifyInput(false)}
          />
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default Home;
