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

      console.log('🎵 [State] Setting room track state to:', trackData);
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

  // Get room ID for the user
  useEffect(() => {
    console.log('🎵 [Debug] Room ID effect triggered, userId:', userId);
    if (!userId) {
      console.log('🎵 [Debug] No userId, skipping room ID setup');
      return;
    }

    const getRoomIdAndSetup = async () => {
      console.log('🔍 Getting room ID for user:', userId);
      const currentRoomId = await getRoomId();
      console.log('🔍 Room ID result:', currentRoomId);
      setRoomId(currentRoomId);

      if (!currentRoomId) {
        console.log('❌ No room found for user, skipping setup');
        setHasRoom(false);
        setRoomTrack(null);
        return;
      }

      setHasRoom(true);
      console.log('✅ Room ID set:', currentRoomId);
    };

    getRoomIdAndSetup();
  }, [userId]);

  // Debug: Log when roomId changes
  useEffect(() => {
    console.log('🎵 [Debug] Room ID changed:', roomId);
  }, [roomId]);

  // Debug: Log when roomTrack state changes
  useEffect(() => {
    console.log('🎵 [State] Room track state changed:', {
      hasTrack: !!roomTrack,
      trackName: roomTrack?.track_name,
      artistName: roomTrack?.artist_name,
      trackId: roomTrack?.track_id,
    });
  }, [roomTrack]);

  // Set up real-time subscription to room_spotify_tracks changes
  useEffect(() => {
    console.log('🎵 [Debug] Real-time effect triggered, roomId:', roomId);
    if (!roomId) {
      console.log('🎵 [Real-time] No room ID available, skipping subscription setup');
      return;
    }

    console.log('🎵 [Real-time] Setting up subscription for room:', roomId);

    // Initial fetch
    console.log('🎵 [Real-time] Performing initial fetch for room:', roomId);
    fetchRoomTrack();

    // Subscribe to real-time updates on the room_spotify_tracks table
    console.log('🎵 [Real-time] Creating channel for room:', roomId);
    const channel = supabase
      .channel(`room_spotify_tracks_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_spotify_tracks',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('🎵 [Real-time] INSERT event received:', payload);
          console.log('🎵 [Real-time] New Spotify track added:', payload.new);
          console.log('🎵 [Real-time] Fetching updated track data...');
          // Fetch the updated track data immediately
          await fetchRoomTrack();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_spotify_tracks',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('🎵 [Real-time] UPDATE event received:', payload);
          console.log('🎵 [Real-time] Spotify track updated:', payload.new);
          // Fetch the updated track data immediately
          await fetchRoomTrack();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_spotify_tracks',
          filter: `room_id=eq.${roomId}`,
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
            roomId,
          );
          console.log('🎵 [Real-time] Channel name:', `room_spotify_tracks_${roomId}`);
          console.log(
            '🎵 [Real-time] Listening for INSERT/UPDATE/DELETE events on room_spotify_tracks table',
          );
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [Real-time] Channel error for room:', roomId);
          console.error('❌ [Real-time] This might be due to RLS policies or network issues');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [Real-time] Channel timeout for room:', roomId);
        } else {
          console.log('🎵 [Real-time] Channel status:', status);
        }
      });

    return () => {
      console.log('🎵 [Real-time] Cleaning up Spotify track listener for room:', roomId);
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, apiClient]); // Added missing dependencies

  return {
    roomTrack,
    hasRoom,
    isLoading,
    roomId,
    refetchRoomTrack: fetchRoomTrack,
  };
}
