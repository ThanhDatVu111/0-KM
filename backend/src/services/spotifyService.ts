import {
  createRoomSpotifyTrack,
  getRoomSpotifyTrack,
  updateRoomSpotifyTrack,
  deleteRoomSpotifyTrack,
  getRoomIdForUser,
  CreateRoomSpotifyTrackInput,
  UpdateRoomSpotifyTrackInput,
  RoomSpotifyTrack,
} from '../models/spotifyModel';
import { AuthenticatedRequest } from '../middleware/auth';

export interface CreateRoomSpotifyTrackRequest {
  user_id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string;
  duration_ms: number;
  track_uri: string;
}

export interface UpdateRoomSpotifyTrackRequest {
  id: string;
  track_id?: string;
  track_name?: string;
  artist_name?: string;
  album_name?: string;
  album_art_url?: string;
  duration_ms?: number;
  track_uri?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  uri: string;
}

/**
 * Create a new room Spotify track
 */
export async function createRoomTrack(
  req: AuthenticatedRequest,
  request: CreateRoomSpotifyTrackRequest,
): Promise<RoomSpotifyTrack | null> {
  try {
    // Use the authenticated user's ID from the request
    const userId = req.user?.id || request.user_id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get the room ID for the user
    const roomId = await getRoomIdForUser(userId);
    if (!roomId) {
      throw new Error('User is not in a room');
    }

    const input: CreateRoomSpotifyTrackInput = {
      room_id: roomId,
      track_id: request.track_id,
      track_name: request.track_name,
      artist_name: request.artist_name,
      album_name: request.album_name,
      album_art_url: request.album_art_url,
      duration_ms: request.duration_ms,
      track_uri: request.track_uri,
      added_by_user_id: userId,
    };

    return await createRoomSpotifyTrack(input, req.supabase);
  } catch (error) {
    console.error('Error in createRoomTrack service:', error);
    throw error;
  }
}

/**
 * Get the current room Spotify track
 */
export async function getRoomTrack(user_id: string): Promise<RoomSpotifyTrack | null> {
  try {
    // Get the room ID for the user
    const roomId = await getRoomIdForUser(user_id);
    if (!roomId) {
      return null; // User is not in a room
    }

    return await getRoomSpotifyTrack(roomId);
  } catch (error) {
    console.error('Error in getRoomTrack service:', error);
    throw error;
  }
}

/**
 * Update room Spotify track
 */
export async function updateRoomTrack(
  user_id: string,
  request: UpdateRoomSpotifyTrackRequest,
): Promise<RoomSpotifyTrack | null> {
  try {
    // Get the room ID for the user
    const roomId = await getRoomIdForUser(user_id);
    if (!roomId) {
      throw new Error('User is not in a room');
    }

    // Get the current track to verify it exists
    const currentTrack = await getRoomSpotifyTrack(roomId);
    if (!currentTrack) {
      throw new Error('No track found in room');
    }

    const input: UpdateRoomSpotifyTrackInput = {
      ...request,
      id: currentTrack.id,
    };

    return await updateRoomSpotifyTrack(input);
  } catch (error) {
    console.error('Error in updateRoomTrack service:', error);
    throw error;
  }
}

/**
 * Delete room Spotify track
 */
export async function deleteRoomTrack(user_id: string): Promise<boolean> {
  try {
    // Get the room ID for the user
    const roomId = await getRoomIdForUser(user_id);
    if (!roomId) {
      throw new Error('User is not in a room');
    }

    // Get the current track to verify it exists
    const currentTrack = await getRoomSpotifyTrack(roomId);
    if (!currentTrack) {
      throw new Error('No track found in room');
    }

    return await deleteRoomSpotifyTrack(currentTrack.id);
  } catch (error) {
    console.error('Error in deleteRoomTrack service:', error);
    throw error;
  }
}

/**
 * Search Spotify tracks using Spotify Web API
 */
export async function searchSpotifyTracks(query: string): Promise<SpotifyTrack[]> {
  try {
    // This would integrate with Spotify Web API
    // For now, return mock data
    const mockTracks: SpotifyTrack[] = [
      {
        id: '1',
        name: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        albumArt: 'https://example.com/album1.jpg',
        duration: 354, // 5:54 in seconds
        uri: 'spotify:track:3z8h0TU7ReDPLIbEnYhWZb',
      },
      {
        id: '2',
        name: 'Hotel California',
        artist: 'Eagles',
        album: 'Hotel California',
        albumArt: 'https://example.com/album2.jpg',
        duration: 391, // 6:31 in seconds
        uri: 'spotify:track:40riOy7x9W7udXy6SA5vKc',
      },
      {
        id: '3',
        name: 'Imagine',
        artist: 'John Lennon',
        album: 'Imagine',
        albumArt: 'https://example.com/album3.jpg',
        duration: 183, // 3:03 in seconds
        uri: 'spotify:track:7pKfPomDEeI4TPT6EOYjn9',
      },
    ];

    // Filter tracks based on query
    const filteredTracks = mockTracks.filter(
      (track) =>
        track.name.toLowerCase().includes(query.toLowerCase()) ||
        track.artist.toLowerCase().includes(query.toLowerCase()) ||
        track.album.toLowerCase().includes(query.toLowerCase()),
    );

    return filteredTracks;
  } catch (error) {
    console.error('Error in searchSpotifyTracks service:', error);
    throw error;
  }
}

/**
 * Play a Spotify track (would integrate with Spotify Web API)
 */
export async function playSpotifyTrack(user_id: string, track_uri: string): Promise<void> {
  try {
    // This would integrate with Spotify Web API to start playback
    console.log(`Playing track ${track_uri} for user ${user_id}`);

    // Mock implementation - in real app, this would:
    // 1. Get user's Spotify access token
    // 2. Call Spotify Web API to start playback
    // 3. Handle any errors from Spotify API

    // For now, just log the action
    console.log('🎵 Spotify playback started:', { user_id, track_uri });
  } catch (error) {
    console.error('Error in playSpotifyTrack service:', error);
    throw error;
  }
}

/**
 * Pause Spotify playback (would integrate with Spotify Web API)
 */
export async function pauseSpotifyPlayback(user_id: string): Promise<void> {
  try {
    // This would integrate with Spotify Web API to pause playback
    console.log(`Pausing playback for user ${user_id}`);

    // Mock implementation
    console.log('🎵 Spotify playback paused:', { user_id });
  } catch (error) {
    console.error('Error in pauseSpotifyPlayback service:', error);
    throw error;
  }
}

/**
 * Skip to next track (would integrate with Spotify Web API)
 */
export async function skipToNextTrack(user_id: string): Promise<void> {
  try {
    // This would integrate with Spotify Web API to skip to next track
    console.log(`Skipping to next track for user ${user_id}`);

    // Mock implementation
    console.log('🎵 Spotify skipped to next track:', { user_id });
  } catch (error) {
    console.error('Error in skipToNextTrack service:', error);
    throw error;
  }
}

/**
 * Skip to previous track (would integrate with Spotify Web API)
 */
export async function skipToPreviousTrack(user_id: string): Promise<void> {
  try {
    // This would integrate with Spotify Web API to skip to previous track
    console.log(`Skipping to previous track for user ${user_id}`);

    // Mock implementation
    console.log('🎵 Spotify skipped to previous track:', { user_id });
  } catch (error) {
    console.error('Error in skipToPreviousTrack service:', error);
    throw error;
  }
}

/**
 * Set playback volume (would integrate with Spotify Web API)
 */
export async function setPlaybackVolume(user_id: string, volume: number): Promise<void> {
  try {
    // This would integrate with Spotify Web API to set volume
    console.log(`Setting volume to ${volume} for user ${user_id}`);

    // Mock implementation
    console.log('🎵 Spotify volume set:', { user_id, volume });
  } catch (error) {
    console.error('Error in setPlaybackVolume service:', error);
    throw error;
  }
}
