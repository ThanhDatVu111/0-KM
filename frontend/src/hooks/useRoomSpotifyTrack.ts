import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { getRoomSpotifyTrack, RoomSpotifyTrack } from '@/apis/spotify';
import { useApiClient } from './useApiClient';
import supabase from '@/utils/supabase';
import { logger } from '@/utils/logger';

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
      logger.spotify.debug(message, data);
      lastLogTime.current = now;
    }
  };

  // Get room ID for the user
  const getRoomId = async () => {
    if (!userId) return null;

    try {
      logger.spotify.debug('Getting room ID for user:', userId);
      const { data, error } = await supabase
        .from('room')
        .select('room_id')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`)
        .eq('filled', true)
        .single();

      if (error) {
        logger.spotify.error('Error getting room ID:', error);
        return null;
      }

      logger.spotify.debug('Found room ID:', data?.room_id);
      return data?.room_id || null;
    } catch (error) {
      logger.spotify.error('Error getting room ID:', error);
      return null;
    }
  };

  const fetchRoomTrack = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      logger.spotify.debug('Fetching room track for user:', userId);
      const trackData = await getRoomSpotifyTrack(userId, apiClient);

      logger.spotify.debug('Room track API response:', trackData);
      if (trackData) {
        logger.spotify.debug('Track data details:', {
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
        logger.spotify.debug('No track data received');
      }

      logger.spotify.debug('Setting room track state to:', trackData);
      setRoomTrack(trackData);
      setHasRoom(true); // If we can fetch room track, user is in a room
      logger.spotify.info('Room track state updated:', {
        hasTrack: !!trackData,
        trackName: trackData?.track_name,
        artistName: trackData?.artist_name,
        userId,
      });
    } catch (error: any) {
      logger.spotify.error('Failed to fetch room track:', error);
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
    logger.spotify.debug('Room ID effect triggered, userId:', userId);
    if (!userId) {
      logger.spotify.debug('No userId, skipping room ID setup');
      return;
    }

    const getRoomIdAndSetup = async () => {
      logger.spotify.debug('Getting room ID for user:', userId);
      const currentRoomId = await getRoomId();
      logger.spotify.debug('Room ID result:', currentRoomId);
      setRoomId(currentRoomId);

      if (!currentRoomId) {
        logger.spotify.debug('No room found for user, skipping setup');
        setHasRoom(false);
        setRoomTrack(null);
        return;
      }

      setHasRoom(true);
      logger.spotify.debug('Room ID set:', currentRoomId);
    };

    getRoomIdAndSetup();
  }, [userId]);

  // Debug: Log when roomId changes
  useEffect(() => {
    logger.spotify.debug('Room ID changed:', roomId);
  }, [roomId]);

  // Debug: Log when roomTrack state changes
  useEffect(() => {
    logger.spotify.debug('Room track state changed:', {
      hasTrack: !!roomTrack,
      trackName: roomTrack?.track_name,
      artistName: roomTrack?.artist_name,
      trackId: roomTrack?.track_id,
    });
  }, [roomTrack]);

  // Set up real-time subscription to room_spotify_tracks changes
  useEffect(() => {
    logger.spotify.debug('Real-time effect triggered, roomId:', roomId);
    if (!roomId) {
      logger.spotify.debug('No room ID available, skipping subscription setup');
      return;
    }

    logger.spotify.debug('Setting up subscription for room:', roomId);

    // Initial fetch
    logger.spotify.debug('Performing initial fetch for room:', roomId);
    fetchRoomTrack();

    // Subscribe to real-time updates on the room_spotify_tracks table
    logger.spotify.debug('Creating channel for room:', roomId);
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
          logger.spotify.debug('INSERT event received:', payload);
          logger.spotify.info('New Spotify track added:', payload.new);
          logger.spotify.debug('Fetching updated track data...');
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
          logger.spotify.debug('UPDATE event received:', payload);
          logger.spotify.info('Spotify track updated:', payload.new);
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
          logger.spotify.debug('DELETE event received:', payload);
          logger.spotify.info('Spotify track removed:', payload.old);
          setRoomTrack(null);
        },
      )
      .subscribe((status) => {
        logger.spotify.debug('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          logger.spotify.info('Successfully subscribed to room_spotify_tracks for room:', roomId);
          logger.spotify.debug('Channel name:', `room_spotify_tracks_${roomId}`);
          logger.spotify.debug(
            'Listening for INSERT/UPDATE/DELETE events on room_spotify_tracks table',
          );
        } else if (status === 'CHANNEL_ERROR') {
          logger.spotify.error('Channel error for room:', roomId);
          logger.spotify.error('This might be due to RLS policies or network issues');
        } else if (status === 'TIMED_OUT') {
          logger.spotify.error('Channel timeout for room:', roomId);
        } else {
          logger.spotify.debug('Channel status:', status);
        }
      });

    return () => {
      logger.spotify.debug('Cleaning up Spotify track listener for room:', roomId);
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
