import { apiClient } from './apiClient';

// Types
export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  uri: string;
}

export interface RoomSpotifyTrack {
  id: string;
  room_id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string;
  duration_ms: number;
  track_uri: string;
  added_by_user_id: string;
  created_at: string;
  updated_at: string;
}

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

// Spotify Search API
export async function searchSpotifyTracks(query: string): Promise<SpotifyTrack[]> {
  try {
    const response = await apiClient.get(`/spotify/search?q=${encodeURIComponent(query)}`);
    return response;
  } catch (error) {
    console.error('Error searching Spotify tracks:', error);
    throw error;
  }
}

// Room-based track functions
export async function createRoomSpotifyTrack(
  request: CreateRoomSpotifyTrackRequest,
): Promise<RoomSpotifyTrack> {
  const response = await apiClient.post('/spotify/room', request);
  return response;
}

export async function getRoomSpotifyTrack(user_id: string): Promise<RoomSpotifyTrack | null> {
  try {
    const response = await apiClient.get(`/spotify/room/${user_id}`);
    return response;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateRoomSpotifyTrack(
  user_id: string,
  request: UpdateRoomSpotifyTrackRequest,
): Promise<RoomSpotifyTrack> {
  const response = await apiClient.put(`/spotify/room/${user_id}`, request);
  return response;
}

export async function deleteRoomSpotifyTrack(user_id: string): Promise<void> {
  await apiClient.delete(`/spotify/room/${user_id}`);
}

// Spotify playback control functions
export async function playSpotifyTrack(user_id: string, track_uri: string): Promise<void> {
  await apiClient.post('/spotify/play', { user_id, track_uri });
}

export async function pauseSpotifyPlayback(user_id: string): Promise<void> {
  await apiClient.post('/spotify/pause', { user_id });
}

export async function skipToNextTrack(user_id: string): Promise<void> {
  await apiClient.post('/spotify/next', { user_id });
}

export async function skipToPreviousTrack(user_id: string): Promise<void> {
  await apiClient.post('/spotify/previous', { user_id });
}

export async function setPlaybackVolume(user_id: string, volume: number): Promise<void> {
  await apiClient.post('/spotify/volume', { user_id, volume });
}

// Spotify authentication
export async function getSpotifyAuthUrl(): Promise<{ auth_url: string }> {
  const response = await apiClient.get('/spotify/auth/url');
  return response;
}

export async function exchangeSpotifyCode(
  code: string,
): Promise<{ access_token: string; refresh_token: string }> {
  const response = await apiClient.post('/spotify/auth/callback', { code });
  return response;
}

export async function refreshSpotifyToken(
  refresh_token: string,
): Promise<{ access_token: string; refresh_token: string }> {
  const response = await apiClient.post('/spotify/auth/refresh', { refresh_token });
  return response;
}

// Spotify user profile
export async function getSpotifyProfile(): Promise<{
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string; height: number; width: number }>;
}> {
  const response = await apiClient.get('/spotify/profile');
  return response;
}

// Spotify user playlists
export async function getUserPlaylists(): Promise<
  Array<{
    id: string;
    name: string;
    description: string;
    images: Array<{ url: string; height: number; width: number }>;
    tracks: { total: number };
  }>
> {
  const response = await apiClient.get('/spotify/playlists');
  return response;
}

// Spotify user top tracks
export async function getUserTopTracks(): Promise<SpotifyTrack[]> {
  const response = await apiClient.get('/spotify/top-tracks');
  return response;
}

// Spotify user recently played
export async function getRecentlyPlayed(): Promise<SpotifyTrack[]> {
  const response = await apiClient.get('/spotify/recently-played');
  return response;
}
