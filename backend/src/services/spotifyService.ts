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
import SpotifyWebApi from 'spotify-web-api-node';
import * as roomService from './roomService';
import * as roomService from './roomService';

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Debug: Log the redirect URI being used
console.log('🔍 Spotify Redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
console.log('🔍 Spotify Client ID:', process.env.SPOTIFY_CLIENT_ID ? 'Set' : 'Not set');
console.log('🔍 Spotify Client Secret:', process.env.SPOTIFY_CLIENT_SECRET ? 'Set' : 'Not set');

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

    console.log('🎵 Creating room track for user:', userId, 'with track:', request.track_uri);

    console.log('🎵 Creating room track for user:', userId, 'with track:', request.track_uri);

    // Get the room ID for the user
    const roomId = await getRoomIdForUser(userId);
    if (!roomId) {
      throw new Error('User is not in a room');
    }

    console.log('🎵 Found room ID:', roomId);

    console.log('🎵 Found room ID:', roomId);

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

    // Create the track
    const track = await createRoomSpotifyTrack(input, req.supabase);

    console.log('🎵 Track created in database:', track ? 'SUCCESS' : 'FAILED');

    if (track) {
      // Update the playback state to include the new track
      console.log('🎵 Updating playback state for room:', roomId);

      const playbackState = {
        is_playing: false,
        current_track_uri: request.track_uri,
        progress_ms: 0,
        controlled_by_user_id: userId,
      };

      console.log('🎵 New playback state:', playbackState);

      await roomService.updatePlaybackState(roomId, playbackState);

      console.log('✅ Track created and playback state updated:', {
        track_id: track.track_id,
        track_uri: request.track_uri,
        controlled_by_user_id: userId,
      });
    }

    return track;
    // Create the track
    const track = await createRoomSpotifyTrack(input, req.supabase);

    console.log('🎵 Track created in database:', track ? 'SUCCESS' : 'FAILED');

    if (track) {
      // Update the playback state to include the new track
      console.log('🎵 Updating playback state for room:', roomId);

      const playbackState = {
        is_playing: false,
        current_track_uri: request.track_uri,
        progress_ms: 0,
        controlled_by_user_id: userId,
      };

      console.log('🎵 New playback state:', playbackState);

      await roomService.updatePlaybackState(roomId, playbackState);

      console.log('✅ Track created and playback state updated:', {
        track_id: track.track_id,
        track_uri: request.track_uri,
        controlled_by_user_id: userId,
      });
    }

    return track;
  } catch (error) {
    console.error('❌ Error in createRoomTrack service:', error);
    console.error('❌ Error in createRoomTrack service:', error);
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

    const success = await deleteRoomSpotifyTrack(currentTrack.id);

    if (success) {
      // Clear the playback state when track is removed
      await roomService.updatePlaybackState(roomId, {
        is_playing: false,
        current_track_uri: null,
        progress_ms: 0,
        controlled_by_user_id: null,
      });

      console.log('✅ Track deleted and playback state cleared');
    }

    return success;
    const success = await deleteRoomSpotifyTrack(currentTrack.id);

    if (success) {
      // Clear the playback state when track is removed
      await roomService.updatePlaybackState(roomId, {
        is_playing: false,
        current_track_uri: null,
        progress_ms: 0,
        controlled_by_user_id: null,
      });

      console.log('✅ Track deleted and playback state cleared');
    }

    return success;
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
    // Check if we have access token
    if (!spotifyApi.getAccessToken()) {
      console.log('No Spotify access token available, returning mock data');
      return getMockTracks(query);
    }

    // Search using Spotify API
    const response = await spotifyApi.searchTracks(query, { limit: 10 });

    if (!response.body.tracks) {
      return [];
    }

    return response.body.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      albumArt: track.album?.images[0]?.url || '',
      duration: Math.floor(track.duration_ms / 1000),
      uri: track.uri,
    }));
  } catch (error) {
    console.error('Error searching Spotify tracks:', error);
    // Fallback to mock data
    return getMockTracks(query);
  }
}

/**
 * Get mock tracks for fallback
 */
function getMockTracks(query: string): SpotifyTrack[] {
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
  return mockTracks.filter(
    (track) =>
      track.name.toLowerCase().includes(query.toLowerCase()) ||
      track.artist.toLowerCase().includes(query.toLowerCase()) ||
      track.album.toLowerCase().includes(query.toLowerCase()),
  );
}

/**
 * Get Spotify authorization URL
 */
export function getSpotifyAuthUrl(): string {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative',
  ];

  const authUrl = spotifyApi.createAuthorizeURL(scopes, 'state');
  console.log('🔗 Generated Spotify Auth URL:', authUrl);
  return authUrl;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);

    // Set the access token
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);

    return {
      access_token: data.body.access_token,
      refresh_token: data.body.refresh_token,
      expires_in: data.body.expires_in,
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  try {
    spotifyApi.setRefreshToken(refreshToken);
    const data = await spotifyApi.refreshAccessToken();

    spotifyApi.setAccessToken(data.body.access_token);

    return {
      access_token: data.body.access_token,
      expires_in: data.body.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Play a Spotify track (requires Spotify Premium)
 */
export async function playSpotifyTrack(user_id: string, track_uri: string): Promise<void> {
  try {
    const accessToken = spotifyApi.getAccessToken();
    console.log('🎵 [Service] playSpotifyTrack called', { user_id, track_uri, accessToken });
    if (!accessToken) {
      console.log('No Spotify access token available');
      return;
    }

    try {
      await spotifyApi.play({
        uris: [track_uri],
      });
      console.log('🎵 [DEBUG] Spotify playback started:', { user_id, track_uri });
    } catch (spotifyError) {
      console.error('❌ [DEBUG] Spotify API play error:', spotifyError);
      throw spotifyError;
    }
    try {
      await spotifyApi.play({
        uris: [track_uri],
      });
      console.log('🎵 [Service] Spotify playback started:', { user_id, track_uri });
    } catch (spotifyError) {
      console.error('❌ [Service] Spotify API play error:', spotifyError);
      throw spotifyError;
    }
  } catch (error) {
    console.error('❌ [DEBUG] Error in playSpotifyTrack service:', error);
    throw error;
  }
}

/**
 * Pause Spotify playback
 */
export async function pauseSpotifyPlayback(user_id: string): Promise<void> {
  try {
    if (!spotifyApi.getAccessToken()) {
      console.log('No Spotify access token available');
      return;
    }

    await spotifyApi.pause();
    console.log('⏸️ Spotify playback paused for user:', user_id);
  } catch (error) {
    console.error('Error in pauseSpotifyPlayback service:', error);
    throw error;
  }
}

/**
 * Skip to next track
 */
export async function skipToNextTrack(user_id: string): Promise<void> {
  try {
    if (!spotifyApi.getAccessToken()) {
      console.log('No Spotify access token available');
      return;
    }

    await spotifyApi.skipToNext();
    console.log('⏭️ Skipped to next track for user:', user_id);
  } catch (error) {
    console.error('Error in skipToNextTrack service:', error);
    throw error;
  }
}

/**
 * Skip to previous track
 */
export async function skipToPreviousTrack(user_id: string): Promise<void> {
  try {
    if (!spotifyApi.getAccessToken()) {
      console.log('No Spotify access token available');
      return;
    }

    await spotifyApi.skipToPrevious();
    console.log('⏮️ Skipped to previous track for user:', user_id);
  } catch (error) {
    console.error('Error in skipToPreviousTrack service:', error);
    throw error;
  }
}

/**
 * Set playback volume
 */
export async function setPlaybackVolume(user_id: string, volume: number): Promise<void> {
  try {
    if (!spotifyApi.getAccessToken()) {
      console.log('No Spotify access token available');
      return;
    }

    await spotifyApi.setVolume(volume);
    console.log('🔊 Set volume to', volume, 'for user:', user_id);
  } catch (error) {
    console.error('Error in setPlaybackVolume service:', error);
    throw error;
  }
}
