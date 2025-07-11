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
import { logger } from '../utils/logger';

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Debug: Log the redirect URI being used
logger.debug('Spotify Redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
logger.debug('Spotify Client ID:', process.env.SPOTIFY_CLIENT_ID ? 'Set' : 'Not set');
logger.debug('Spotify Client Secret:', process.env.SPOTIFY_CLIENT_SECRET ? 'Set' : 'Not set');

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
 * Get Spotify access token from Supabase user metadata
 */
async function getSpotifyAccessTokenFromUser(userId: string): Promise<string | null> {
  try {
    // This would typically be done by getting the user's OAuth session from Supabase
    // For now, we'll use the existing Spotify API instance
    const accessToken = spotifyApi.getAccessToken();
    if (accessToken) {
      return accessToken;
    }

    // If no token is set, we need to get it from the user's Supabase session
    // This would require the frontend to pass the access token in the request
    logger.spotify.warn('No Spotify access token available for user:', userId);
    return null;
  } catch (error) {
    logger.spotify.error('Error getting Spotify access token for user:', userId, error);
    return null;
  }
}

/**
 * Set Spotify access token for API calls
 */
async function setSpotifyAccessTokenForUser(userId: string, accessToken: string): Promise<void> {
  try {
    spotifyApi.setAccessToken(accessToken);
    logger.spotify.debug('Spotify access token set for user:', userId);
  } catch (error) {
    logger.spotify.error('Error setting Spotify access token for user:', userId, error);
  }
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

    // Create the track
    console.log('🎵 [DEBUG] Creating room track with input:', input);
    const track = await createRoomSpotifyTrack(input, req.supabase);
    console.log('🎵 [DEBUG] Track created result:', track);

    if (track) {
      // Update the playback state to include the new track
      const playbackState = {
        is_playing: false,
        current_track_uri: request.track_uri,
        progress_ms: 0,
        controlled_by_user_id: userId,
      };

      console.log('🎵 [DEBUG] Updating playback state:', playbackState);
      await roomService.updatePlaybackState(roomId, playbackState);
      console.log('🎵 [DEBUG] Playback state updated');
    }

    return track;
  } catch (error) {
    logger.spotify.error('Error in createRoomTrack service:', error);
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
      logger.spotify.debug('User is not in a room:', user_id);
      return null; // User is not in a room
    }

    const track = await getRoomSpotifyTrack(roomId);
    logger.spotify.debug('Retrieved track for room:', { roomId, hasTrack: !!track });
    return track;
  } catch (error) {
    logger.spotify.error('Error in getRoomTrack service:', error);
    // Don't throw error, just return null to indicate no track found
    return null;
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
    logger.spotify.error('Error in updateRoomTrack service:', error);
    throw error;
  }
}

/**
 * Delete room Spotify track
 */
export async function deleteRoomTrack(user_id: string): Promise<boolean> {
  try {
    console.log('🎵 [DEBUG] Deleting room track for user:', user_id);

    // Get the room ID for the user
    const roomId = await getRoomIdForUser(user_id);
    if (!roomId) {
      console.log('🎵 [DEBUG] User is not in a room');
      return false; // Return false instead of throwing error
    }

    // Get the current track to verify it exists
    const currentTrack = await getRoomSpotifyTrack(roomId);
    if (!currentTrack) {
      console.log('🎵 [DEBUG] No track found in room:', roomId);
      return false; // Return false instead of throwing error
    }

    console.log('🎵 [DEBUG] Found track to delete:', currentTrack.id);
    const success = await deleteRoomSpotifyTrack(currentTrack.id);
    console.log('🎵 [DEBUG] Delete operation result:', success);

    if (success) {
      // Clear the playback state when track is removed
      await roomService.updatePlaybackState(roomId, {
        is_playing: false,
        current_track_uri: null,
        progress_ms: 0,
        controlled_by_user_id: null,
      });

      logger.spotify.info('Track deleted and playback state cleared');
    }

    return success;
  } catch (error) {
    logger.spotify.error('Error in deleteRoomTrack service:', error);
    return false; // Return false instead of throwing error
  }
}

/**
 * Delete room Spotify track by room ID
 */
export async function deleteRoomTrackByRoomId(room_id: string): Promise<boolean> {
  try {
    console.log('🎵 [DEBUG] Deleting room track by room ID:', room_id);

    // Get the current track to verify it exists
    const currentTrack = await getRoomSpotifyTrack(room_id);
    if (!currentTrack) {
      console.log('🎵 [DEBUG] No track found in room:', room_id);
      return false; // Return false instead of throwing error
    }

    console.log('🎵 [DEBUG] Found track to delete:', currentTrack.id);
    const success = await deleteRoomSpotifyTrack(currentTrack.id);
    console.log('🎵 [DEBUG] Delete operation result:', success);

    if (success) {
      // Clear the playback state when track is removed
      await roomService.updatePlaybackState(room_id, {
        is_playing: false,
        current_track_uri: null,
        progress_ms: 0,
        controlled_by_user_id: null,
      });

      logger.spotify.info('Track deleted and playback state cleared for room:', room_id);
    }

    return success;
  } catch (error) {
    logger.spotify.error('Error in deleteRoomTrackByRoomId service:', error);
    return false; // Return false instead of throwing error
  }
}

/**
 * Search Spotify tracks using Spotify Web API
 */
export async function searchSpotifyTracks(query: string): Promise<SpotifyTrack[]> {
  try {
    console.log('🔍 [DEBUG] Starting search for query:', query);

    // Get client credentials token for search
    let accessToken = spotifyApi.getAccessToken();

    if (!accessToken) {
      console.log('🔍 [DEBUG] No access token, getting client credentials...');
      try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body.access_token);
        accessToken = data.body.access_token;
        console.log('🔍 [DEBUG] Got client credentials token');
      } catch (error) {
        console.error('❌ Error getting client credentials:', error);
        console.log('🔍 [DEBUG] Falling back to mock data');
        return getMockTracks(query);
      }
    }

    // Search using Spotify API
    console.log('🔍 [DEBUG] Searching Spotify with query:', query);
    const response = await spotifyApi.searchTracks(query, { limit: 10 });

    if (!response.body.tracks) {
      console.log('🔍 [DEBUG] No tracks found in response');
      return [];
    }

    const tracks = response.body.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      albumArt: track.album?.images[0]?.url || '',
      duration: Math.floor(track.duration_ms / 1000),
      uri: track.uri,
    }));

    console.log('🔍 [DEBUG] Found', tracks.length, 'tracks');
    return tracks;
  } catch (error) {
    console.error('❌ Error searching Spotify tracks:', error);
    // Fallback to mock data
    console.log('🔍 [DEBUG] Falling back to mock data due to error');
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
export async function playSpotifyTrack(
  user_id: string,
  track_uri: string,
  accessToken?: string,
): Promise<void> {
  try {
    // Set the access token if provided
    if (accessToken) {
      await setSpotifyAccessTokenForUser(user_id, accessToken);
    }

    const currentAccessToken = spotifyApi.getAccessToken();
    if (!currentAccessToken) {
      console.log('No Spotify access token available');
      return;
    }

    try {
      await spotifyApi.play({
        uris: [track_uri],
      });
    } catch (spotifyError) {
      console.error('❌ [DEBUG] Spotify API play error:', spotifyError);
      throw spotifyError;
    }
  } catch (error) {
    console.error('❌ Error in playSpotifyTrack service:', error);
    throw error;
  }
}

/**
 * Pause Spotify playback
 */
export async function pauseSpotifyPlayback(user_id: string, accessToken?: string): Promise<void> {
  try {
    // Set the access token if provided
    if (accessToken) {
      await setSpotifyAccessTokenForUser(user_id, accessToken);
    }

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
export async function skipToNextTrack(user_id: string, accessToken?: string): Promise<void> {
  try {
    // Set the access token if provided
    if (accessToken) {
      await setSpotifyAccessTokenForUser(user_id, accessToken);
    }

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
export async function skipToPreviousTrack(user_id: string, accessToken?: string): Promise<void> {
  try {
    // Set the access token if provided
    if (accessToken) {
      await setSpotifyAccessTokenForUser(user_id, accessToken);
    }

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
export async function setPlaybackVolume(
  user_id: string,
  volume: number,
  accessToken?: string,
): Promise<void> {
  try {
    // Set the access token if provided
    if (accessToken) {
      await setSpotifyAccessTokenForUser(user_id, accessToken);
    }

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
