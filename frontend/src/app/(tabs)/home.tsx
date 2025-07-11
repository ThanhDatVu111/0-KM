import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Alert,
  Switch,
  Pressable,
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
import { useRoomYouTubeVideo } from '@/hooks/useRoomYouTubeVideo';
import { useSharedSpotifyTrack } from '@/hooks/useSharedSpotifyTrack';
import { createRoomVideo, deleteRoomVideo } from '@/apis/youtube';
import {
  createRoomSpotifyTrack,
  deleteRoomSpotifyTrack,
  deleteRoomSpotifyTrackByRoomId,
} from '@/apis/spotify';
import { useApiClient } from '@/hooks/useApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotifyPlayback } from '@/hooks/useSpotifyPlayback';
import { SpotifyWidget } from '@/components/music/SpotifyWidget';
import { TimeWidget } from '@/components/TimeWidget';
import { WeatherWidget } from '@/components/WeatherWidget';
import { AnniversaryWidget } from '@/components/AnniversaryWidget';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { locationTrackingService } from '@/services/locationTracking';
import { updateUserLocation } from '@/apis/user';
import Profile from '@/screens/Profile';

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
    className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${noPadding ? '' : 'p-4'} ${className}`}
  >
    {children}
  </View>
);

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

const Home = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const apiClient = useApiClient();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showYouTubeInput, setShowYouTubeInput] = useState(false);
  const [showSpotifyInput, setShowSpotifyInput] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const isLocationEnabled = true;

  const { roomVideo, hasRoom, isLoading: videoLoading, refetchRoomVideo } = useRoomYouTubeVideo();
  const {
    track: roomTrack,
    isLoading: spotifyLoading,
    refetch: refetchRoomTrack,
    clearTrack: clearRoomTrack,
  } = useSharedSpotifyTrack(roomId);

  // Debug: Log when roomId changes
  useEffect(() => {
    if (roomId) {
      // Force a refetch when roomId changes
      setTimeout(() => {
        refetchRoomTrack();
      }, 500);
    }
  }, [roomId, refetchRoomTrack]);

  // Real Spotify playback controls - only use when connected
  const { playTrack, playbackState } = useSpotifyPlayback();

  useEffect(() => {
    if (userId) {
      loadUserRoom();
      startLocationTracking();
    }

    // Cleanup location tracking when component unmounts
    return () => {
      if (userId) {
        stopLocationTracking();
      }
    };
  }, [userId]);

  // Effect: Stop location tracking if toggled off
  useEffect(() => {
    if (!isLocationEnabled && userId) {
      locationTrackingService.stopTracking();
      // Optionally clear location in backend
      updateUserLocation({
        user_id: userId,
        location_latitude: undefined,
        location_longitude: undefined,
        location_city: undefined,
        location_country: undefined,
        timezone: undefined,
      });
    }
  }, [isLocationEnabled, userId]);

  const startLocationTracking = async () => {
    if (!userId) return;

    try {
      await locationTrackingService.startTracking(userId);
    } catch (error) {
      // Don't show alert - location tracking is optional
    }
  };

  const stopLocationTracking = async () => {
    try {
      await locationTrackingService.stopTracking();
    } catch (error) {
      // Don't show alert - location tracking is optional
    }
  };

  const loadUserRoom = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const room = await fetchRoom({ user_id: userId });

      if (room) {
        setRoomId(room.room_id);
        setIsHost(room.user_1 === userId);
      } else {
        setRoomId(null);
        setIsHost(false);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddYouTubeVideo = async (videoId: string) => {
    if (!userId) return;

    try {
      const result = await createRoomVideo(
        {
          user_id: userId,
          video_id: videoId,
        },
        apiClient,
      );
      setShowYouTubeInput(false);
      // Refetch the room video to update the UI
      refetchRoomVideo();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.data?.error || error.message || 'Failed to add YouTube video. Please try again.',
      );
    }
  };

  const handleRemoveYouTubeVideo = async () => {
    if (!userId) return;

    try {
      await deleteRoomVideo(userId, apiClient);
      refetchRoomVideo();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.data?.error || error.message || 'Failed to remove YouTube video. Please try again.',
      );
    }
  };

  const handleAddSpotifyTrack = async (trackData: any) => {
    if (!userId) return;

    try {
      const result = await createRoomSpotifyTrack(
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

      setShowSpotifyInput(false);

      // Refetch the room track to update the UI
      await refetchRoomTrack();

      // Automatically play the track when added
      try {
        await playTrack(trackData.track_uri);
        Alert.alert('Success!', `Now playing: ${trackData.track_name}`);
      } catch (playError: any) {
        let errorMessage = `${trackData.track_name} was added to your room, but couldn't start playing automatically.`;

        if (playError.message?.includes('Premium required')) {
          errorMessage =
            'Spotify Premium is required for playback control. Please upgrade your account.';
        } else if (playError.message?.includes('No active Spotify devices')) {
          errorMessage =
            'Please open Spotify on another device (phone, computer, etc.) to enable playback control.';
        } else if (playError.message?.includes('No active Spotify device found')) {
          errorMessage = 'No active Spotify device found. Please open Spotify on another device.';
        } else {
          errorMessage = `${trackData.track_name} was added to your room, but couldn't start playing automatically. ${playError.message}`;
        }

        Alert.alert('Track Added', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add track to room. Please try again.');
    }
  };

  const handleRemoveSpotifyTrack = async () => {
    if (!userId) return;

    try {
      // Use the clearTrack function from the hook
      await clearRoomTrack();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove track. Please try again.');
    }
  };

  const handleDeleteSpotifyTrack = async () => {
    if (!roomId) return;

    try {
      await deleteRoomSpotifyTrackByRoomId(roomId, apiClient);
      refetchRoomTrack();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete track. Please try again.');
    }
  };

  const handleSpotifyReconnect = () => {
    // Close the search modal and let the user reconnect through the widget
    setShowSpotifyInput(false);
    // The UnifiedSpotifyWidget will handle the reconnection flow
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

      {/* Profile Button in the absolute top right corner */}
      <Pressable
        onPress={() => setShowProfile(true)}
        style={{
          position: 'absolute',
          top: 80,
          right: 24,
          backgroundColor: '#F24187',
          borderRadius: 12,
          borderWidth: 2,
          borderColor: '#6536DD',
          padding: 8,
          shadowColor: '#6536DD',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 8,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <FontAwesome name="user" size={32} color="#fff" />
      </Pressable>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 140, paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Enable Location Toggle */}
        {/* Removed location toggle UI */}

        {/* Top Widget Grid */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          {/* Calendar Widget */}
          <WidgetCard className="flex-1 min-w-[140px] h-48 overflow-hidden" noPadding>
            <RetroHeader title="CALENDAR" />
            <View
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderBottomLeftRadius: 6,
                borderBottomRightRadius: 6,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: 'PixelifySans',
                  fontSize: 18,
                }}
                className="text-center text-black mb-1"
              >
                Friday 14
              </Text>
              <Text
                style={{
                  fontFamily: 'PixelifySans',
                  fontSize: 14,
                }}
                className="text-center text-gray-600 px-3"
              >
                Movie night in 3 days!
              </Text>
            </View>
          </WidgetCard>

          {/* Time Widget */}
          <TimeWidget className="flex-1 min-w-[140px] h-48" fallbackUserName="Partner" />
        </View>

        {/* Second row */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          {/* Weather Widget */}
          <WeatherWidget
            className="flex-1 min-w-[140px] h-48"
            fallbackUserName="Partner"
            defaultCity="San Francisco"
            isLocationEnabled={isLocationEnabled}
          />

          {/* Anniversary Widget */}
          <AnniversaryWidget className="flex-1 min-w-[140px] h-48" fallbackUserName="Partner" />
        </View>

        {/* YouTube Music Widget */}
        <View className="mb-4">
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 18,
            }}
            className="text-white mb-3"
          >
            {hasRoom ? "What We're Watching" : 'My Music Video'}
          </Text>
          {roomVideo ? (
            <View className="h-72">
              <YouTubeWidget
                videoId={roomVideo.video_id}
                onPress={
                  roomVideo.added_by_user_id === userId ? handleRemoveYouTubeVideo : undefined
                }
                className="h-full"
              />
            </View>
          ) : (
            <View className="h-48 shadow-2xl border-2 border-black rounded-lg overflow-hidden">
              <RetroHeader title="YOUTUBE" />
              <View className="bg-[#FDA3D4] flex-1 rounded-b-md">
                <View className="px-4 pt-0 pb-2 flex-1 justify-center items-center">
                  <Ionicons name="play-circle" size={24} color="#6536DD" />
                  <Text
                    style={{
                      fontFamily: 'PixelifySans',
                      fontSize: 14,
                    }}
                    className="text-black mt-2 mb-3 text-center"
                  >
                    {canAddVideo
                      ? 'No video playing'
                      : 'Waiting for your partner to add a video...'}
                  </Text>
                  {canAddVideo && (
                    <TouchableOpacity
                      onPress={() => setShowYouTubeInput(true)}
                      className="bg-[#6536DD] border-2 border-black"
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
                        <Text
                          style={{
                            fontFamily: 'PixelifySans',
                            fontSize: 12,
                          }}
                          className="text-white ml-1"
                        >
                          ADD VIDEO
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Spotify Widget */}
        <View className="mb-4">
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 18,
            }}
            className="text-white mb-3"
          >
            {roomId ? "What We're Listening To" : 'My Music'}
          </Text>

          <View
            className={roomTrack?.track_uri || playbackState?.currentTrack ? 'h-[420px]' : 'h-60'}
          >
            <SpotifyWidget
              roomId={roomId || undefined}
              canControl={true}
              onPress={
                roomTrack?.controlled_by_user_id === userId
                  ? handleRemoveSpotifyTrack
                  : () => setShowSpotifyInput(true)
              }
              className="h-full"
            />
          </View>
        </View>

        {/* Join Room Widget */}
        {!roomId && (
          <TouchableOpacity
            className="h-28 mt-4 items-center justify-center rounded-2xl border border-white/20 bg-primary/80 p-4 shadow-md backdrop-blur-lg"
            onPress={() => router.push('/(onboard)/join-room')}
          >
            <Text
              style={{
                fontFamily: 'PixelifySans',
                fontSize: 16,
              }}
              className="text-center text-white"
            >
              + Join a room to connect with your partner +
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
            onReconnect={handleSpotifyReconnect}
          />
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={{ flex: 1 }}>
          <Pressable
            onPress={() => setShowProfile(false)}
            style={{
              position: 'absolute',
              top: 70,
              right: 30,
              width: 48,
              height: 48,
              backgroundColor: '#F24187',
              borderRadius: 8,
              borderWidth: 2,
              borderColor: '#6536DD',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#6536DD',
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
              zIndex: 10,
            }}
          >
            <Text style={{ color: '#fff', fontFamily: 'PressStart2P', fontSize: 20 }}>X</Text>
          </Pressable>
          <Profile />
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default Home;
