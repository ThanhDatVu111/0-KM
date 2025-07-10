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
import { useRoomYouTubeVideo } from '@/hooks/useRoomYouTubeVideo';
import { useRoomSpotifyTrack } from '@/hooks/useRoomSpotifyTrack';
import { createRoomVideo, deleteRoomVideo } from '@/apis/youtube';
import {
  createRoomSpotifyTrack,
  deleteRoomSpotifyTrack,
  deleteRoomSpotifyTrackByRoomId,
} from '@/apis/spotify';
import { useApiClient } from '@/hooks/useApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import { useSpotifyPlayback } from '@/hooks/useSpotifyPlayback';
import { UnifiedSpotifyWidget } from '@/components/music/UnifiedSpotifyWidget';
import { TimeWidget } from '@/components/TimeWidget';
import { WeatherWidget } from '@/components/WeatherWidget';
import { Ionicons } from '@expo/vector-icons';
import { locationTrackingService } from '@/services/locationTracking';
import * as Location from 'expo-location';
import { updateUserLocation } from '@/apis/user';
import { fetchUser } from '@/apis/user';
import { usePartnerData } from '@/hooks/usePartnerData';

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
  const [isLocationTracking, setIsLocationTracking] = useState(false);

  const { roomVideo, hasRoom, isLoading: videoLoading, refetchRoomVideo } = useRoomYouTubeVideo();
  const {
    roomTrack,
    hasRoom: hasSpotifyRoom,
    isLoading: spotifyLoading,
    refetchRoomTrack,
  } = useRoomSpotifyTrack();

  const { partnerData, hasRoom: hasPartnerRoom, isLoading: partnerLoading } = usePartnerData();

  // Real Spotify playback controls
  const { playTrack } = useSpotifyPlayback();

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

  const startLocationTracking = async () => {
    if (!userId) return;

    try {
      console.log('📍 Starting location tracking from home screen');
      await locationTrackingService.startTracking(userId);
      setIsLocationTracking(true);
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      // Don't show alert - location tracking is optional
    }
  };

  const stopLocationTracking = async () => {
    try {
      console.log('📍 Stopping location tracking from home screen');
      await locationTrackingService.stopTracking();
      setIsLocationTracking(false);
    } catch (error) {
      console.error('❌ Failed to stop location tracking:', error);
    }
  };

  const loadUserRoom = async () => {
    try {
      setIsLoading(true);
      const roomData = await fetchRoom({ user_id: userId! });

      if (roomData && roomData.room_id) {
        setRoomId(roomData.room_id);
        setIsHost(true);
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
      setShowSpotifyInput(false);
      // Refetch the room track to update the UI
      await refetchRoomTrack();

      // Automatically play the track when added
      try {
        await playTrack(trackData.track_uri);
        Alert.alert('Success!', `Now playing: ${trackData.track_name}`);
      } catch (playError) {
        Alert.alert(
          'Track Added',
          `${trackData.track_name} was added to your room, but couldn't start playing automatically. Make sure you have Spotify open on another device.`,
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add track to room. Please try again.');
    }
  };

  const handleRemoveSpotifyTrack = async () => {
    if (!userId) return;

    try {
      await deleteRoomSpotifyTrack(userId, apiClient);
      refetchRoomTrack();
    } catch (error) {
      // Handle error silently
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

  const testLocationDetection = async () => {
    try {
      console.log('🧪 Testing location detection...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      console.log('🧪 Current location:', { latitude, longitude });

      const geocodeResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      console.log('🧪 Geocode result:', geocodeResult);

      if (geocodeResult.length > 0) {
        const address = geocodeResult[0];
        const locationData = {
          user_id: userId!,
          location_latitude: latitude,
          location_longitude: longitude,
          location_city: address.city || 'Unknown City',
          location_country: address.country || 'Unknown Country',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        console.log('🧪 Updating user location with:', locationData);
        await updateUserLocation(locationData);
        Alert.alert('Success', 'Location updated successfully!');
      }
    } catch (error) {
      console.error('🧪 Error testing location:', error);
      Alert.alert('Error', 'Failed to update location');
    }
  };

  const checkCurrentUserLocation = async () => {
    try {
      console.log('🧪 Checking current user location data...');
      const userData = await fetchUser(userId!);
      console.log('🧪 Current user data:', userData);
      console.log('🧪 Current user location data:', {
        location_latitude: userData.location_latitude,
        location_longitude: userData.location_longitude,
        location_city: userData.location_city,
        location_country: userData.location_country,
        timezone: userData.timezone,
      });
      Alert.alert('User Data', JSON.stringify(userData, null, 2));
    } catch (error) {
      console.error('🧪 Error checking user location:', error);
      Alert.alert('Error', 'Failed to check user location');
    }
  };

  const checkPartnerData = async () => {
    try {
      console.log('🧪 Checking partner data...');
      console.log('🧪 Partner data:', partnerData);
      console.log('🧪 Has room:', hasPartnerRoom);
      console.log('🧪 Partner loading:', partnerLoading);

      if (partnerData) {
        Alert.alert('Partner Data', JSON.stringify(partnerData, null, 2));
      } else {
        Alert.alert('Partner Data', 'No partner data available');
      }
    } catch (error) {
      console.error('🧪 Error checking partner data:', error);
      Alert.alert('Error', 'Failed to check partner data');
    }
  };

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
        {/* Location Tracking Toggle */}
        <View className="mb-4 flex-row justify-end">
          <TouchableOpacity
            onPress={isLocationTracking ? stopLocationTracking : startLocationTracking}
            className={`flex-row items-center px-3 py-2 rounded-full ${
              isLocationTracking ? 'bg-green-500/20' : 'bg-white/20'
            }`}
          >
            <Ionicons
              name={isLocationTracking ? 'location' : 'location-outline'}
              size={16}
              color="white"
            />
            <Text className="text-white font-pregular text-sm ml-2">
              {isLocationTracking ? 'Location Active' : 'Enable Location'}
            </Text>
          </TouchableOpacity>
        </View>

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
          <TimeWidget className="flex-1 min-w-[140px] h-48" fallbackUserName="Partner" />
        </View>

        {/* Second row */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          {/* Weather Widget */}
          <WeatherWidget
            className="flex-1 min-w-[140px] h-48"
            fallbackUserName="Partner"
            defaultCity="San Francisco"
          />

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
            onDeleteTrack={roomTrack ? handleDeleteSpotifyTrack : undefined}
            onAddTrack={() => setShowSpotifyInput(true)}
          />
        </View>

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

      {/* Temporary Debug Button */}
      <View className="absolute top-16 left-5 z-50">
        <TouchableOpacity
          onPress={testLocationDetection}
          className="bg-red-500 px-3 py-2 rounded-lg mb-2"
        >
          <Text className="text-white text-xs">Test Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={checkCurrentUserLocation}
          className="bg-blue-500 px-3 py-2 rounded-lg mb-2"
        >
          <Text className="text-white text-xs">Check User</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={checkPartnerData} className="bg-green-500 px-3 py-2 rounded-lg">
          <Text className="text-white text-xs">Check Partner</Text>
        </TouchableOpacity>
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
            onReconnect={handleSpotifyReconnect}
          />
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default Home;
