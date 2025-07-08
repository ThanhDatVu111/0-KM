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
      const { data, error } = await supabase
        .from('room')
        .select('room_id')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`)
        .eq('filled', true)
        .single();

      if (error) {
        console.error('Error getting room ID:', error);
        return null;
      }

      return data?.room_id || null;
    } catch (error) {
      console.error('Error getting room ID:', error);
      return null;
    }
  };

  const fetchRoomTrack = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const trackData = await getRoomSpotifyTrack(userId, apiClient);

      // Throttle debug logging
      const debugKey = `${userId}-${trackData?.track_id || 'null'}`;
      if (lastLogTime.current === 0) {
        console.log('🔄 Fetching room track for user:', userId);
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
        }
        console.log('✅ Room track state updated:', trackData);
      }

      setRoomTrack(trackData);
      setHasRoom(true); // If we can fetch room track, user is in a room
    } catch (error: any) {
      console.error('Failed to fetch room track:', error);
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
      // Get room ID first
      const currentRoomId = await getRoomId();
      setRoomId(currentRoomId);

      if (!currentRoomId) {
        setHasRoom(false);
        setRoomTrack(null);
        return;
      }

      setHasRoom(true);
      throttledLog('🎵 [Real-time] Setting up Spotify track listener for room:', currentRoomId);

      // Initial fetch
      await fetchRoomTrack();

      // Subscribe to real-time updates on the room_spotify_tracks table
      const channel = supabase
        .channel('room_spotify_tracks')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'room_spotify_tracks',
            filter: `room_id=eq.${currentRoomId}`,
          },
          (payload) => {
            throttledLog('🎵 [Real-time] New Spotify track added:', payload.new);
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
            throttledLog('🎵 [Real-time] Spotify track updated:', payload.new);
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
            throttledLog('🎵 [Real-time] Spotify track removed:', payload.old);
            setRoomTrack(null);
          },
        )
        .subscribe();

      return () => {
        throttledLog('🎵 [Real-time] Cleaning up Spotify track listener');
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
