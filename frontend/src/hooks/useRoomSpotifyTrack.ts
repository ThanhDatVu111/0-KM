import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { getRoomSpotifyTrack, RoomSpotifyTrack } from '@/apis/spotify';
import { useApiClient } from './useApiClient';
import supabase from '@/utils/supabase';

export function useRoomSpotifyTrack() {
  const { userId } = useAuth();
  const apiClient = useApiClient();
  const [roomTrack, setRoomTrack] = useState<RoomSpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRoom, setHasRoom] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const lastLogTime = useRef<number>(0);

  // Throttle logging to every 5 seconds
  const throttledLog = (message: string, data?: any) => {
    const now = Date.now();
    if (now - lastLogTime.current > 5000) {
      console.log(message, data);
      lastLogTime.current = now;
    }
  };

  // Get room ID for the user
  const getRoomId = async () => {
    if (!userId) return null;

    try {
      console.log('🔍 Getting room ID for user:', userId);
      const { data, error } = await supabase
        .from('room')
        .select('room_id')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`)
        .eq('filled', true)
        .single();

      if (error) {
        console.error('❌ Error getting room ID:', error);
        return null;
      }

      console.log('✅ Found room ID:', data?.room_id);
      return data?.room_id || null;
    } catch (error) {
      console.error('❌ Error getting room ID:', error);
      return null;
    }
  };

  const fetchRoomTrack = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      console.log('🔄 Fetching room track for user:', userId);
      const trackData = await getRoomSpotifyTrack(userId, apiClient);

      console.log('📡 Room track API response:', trackData);
      if (trackData) {
        console.log('📊 Track data details:', {
          track_id: trackData.track_id,
          track_name: trackData.track_name,
          artist_name: trackData.artist_name,
          album_name: trackData.album_name,
          album_art_url: trackData.album_art_url,
          duration_ms: trackData.duration_ms,
          track_uri: trackData.track_uri,
          added_by_user_id: trackData.added_by_user_id,
        });
      } else {
        console.log('📊 No track data received');
      }

      setRoomTrack(trackData);
      setHasRoom(true); // If we can fetch room track, user is in a room
      console.log('✅ Room track state updated:', {
        hasTrack: !!trackData,
        trackName: trackData?.track_name,
        artistName: trackData?.artist_name,
        userId,
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch room track:', error);
      if (error.status === 400 && error.data?.error === 'User must be in a room to add tracks') {
        setHasRoom(false);
        setRoomTrack(null);
      } else {
        // Other errors might still mean user is in a room but no track
        setHasRoom(true);
        setRoomTrack(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription to room_spotify_tracks changes
  useEffect(() => {
    if (!userId) return;

    const setupRealtimeSubscription = async () => {
      console.log('🎵 [Real-time] Setting up subscription for user:', userId);

      // Get room ID first
      const currentRoomId = await getRoomId();
      setRoomId(currentRoomId);

      if (!currentRoomId) {
        console.log('❌ No room found for user, skipping real-time setup');
        setHasRoom(false);
        setRoomTrack(null);
        return;
      }

      setHasRoom(true);
      console.log('🎵 [Real-time] Setting up Spotify track listener for room:', currentRoomId);

      // Initial fetch
      await fetchRoomTrack();

      // Subscribe to real-time updates on the room_spotify_tracks table
      const channel = supabase
        .channel(`room_spotify_tracks_${currentRoomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'room_spotify_tracks',
            filter: `room_id=eq.${currentRoomId}`,
          },
          (payload) => {
            console.log('🎵 [Real-time] INSERT event received:', payload);
            console.log('🎵 [Real-time] New Spotify track added:', payload.new);
            console.log('🎵 [Real-time] Fetching updated track data...');
            // Fetch the updated track data
            fetchRoomTrack();
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'room_spotify_tracks',
            filter: `room_id=eq.${currentRoomId}`,
          },
          (payload) => {
            console.log('🎵 [Real-time] UPDATE event received:', payload);
            console.log('🎵 [Real-time] Spotify track updated:', payload.new);
            // Fetch the updated track data
            fetchRoomTrack();
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'room_spotify_tracks',
            filter: `room_id=eq.${currentRoomId}`,
          },
          (payload) => {
            console.log('🎵 [Real-time] DELETE event received:', payload);
            console.log('🎵 [Real-time] Spotify track removed:', payload.old);
            setRoomTrack(null);
          },
        )
        .subscribe((status) => {
          console.log('🎵 [Real-time] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log(
              '✅ [Real-time] Successfully subscribed to room_spotify_tracks for room:',
              currentRoomId,
            );
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ [Real-time] Channel error for room:', currentRoomId);
          } else if (status === 'TIMED_OUT') {
            console.error('❌ [Real-time] Channel timeout for room:', currentRoomId);
          }
        });

      return () => {
        console.log('🎵 [Real-time] Cleaning up Spotify track listener for room:', currentRoomId);
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, [userId]);

  return {
    roomTrack,
    hasRoom,
    isLoading,
    roomId,
    refetchRoomTrack: fetchRoomTrack,
  };
}
