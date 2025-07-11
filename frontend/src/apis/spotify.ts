import { apiClient, BASE_URL } from './apiClient';

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

// Create an unauthenticated API client for OAuth endpoints
const unauthenticatedApiClient = {
  async get(endpoint: string) {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      };
    }

    return response.json();
  },

  async post(endpoint: string, data?: any) {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      };
    }

    return response.json();
  },
};

// OAuth and Token Management
export async function getSpotifyAuthUrl(): Promise<{ auth_url: string }> {
  try {
    const data = await unauthenticatedApiClient.get('/spotify/auth/url'); // No auth token needed for OAuth

    // Backend returns { data: { authUrl } }, convert to { auth_url }
    const authUrl = data?.data?.authUrl || data?.authUrl;
    if (!authUrl) {
      throw new Error('No auth URL received from backend');
    }

    return { auth_url: authUrl };
  } catch (error) {
    throw error;
  }
}

export async function exchangeSpotifyCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    const data = await unauthenticatedApiClient.post('/spotify/auth/callback', { code }); // No auth token needed for OAuth

    // Backend returns { data: { access_token, refresh_token, expires_in } }
    const tokenData = data?.data || data;
    if (!tokenData?.access_token) {
      throw new Error('No access token received from backend');
    }

    return tokenData;
  } catch (error) {
    throw error;
  }
}

export async function refreshSpotifyToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const data = await apiClient.post('/spotify/auth/refresh', { refresh_token: refreshToken });
  return data;
}

// Spotify Search API
export async function searchSpotifyTracks(query: string): Promise<SpotifyTrack[]> {
  try {
    const trimmedQuery = query.trim();
    const url = `/spotify/search?q=${encodeURIComponent(trimmedQuery)}`;

    const response = await unauthenticatedApiClient.get(url);

    // Extract the data field from the response
    const tracks = response?.data || [];

    return tracks;
  } catch (error) {
    throw error;
  }
}

// Room-based track functions (these will be used with authenticated client)
export async function createRoomSpotifyTrack(
  request: CreateRoomSpotifyTrackRequest,
  apiClientInstance: any,
): Promise<RoomSpotifyTrack> {
  const response = await apiClientInstance.post('/spotify/room', request);

  // Extract the data field from the response
  const data = response?.data || response;

  return data;
}

export async function getRoomSpotifyTrack(
  user_id: string,
  apiClientInstance: any,
): Promise<RoomSpotifyTrack | null> {
  try {
    const response = await apiClientInstance.get(`/spotify/room/${user_id}`);

    // Extract the data field from the response
    const data = response?.data || response;

    return data;
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
  apiClientInstance: any,
): Promise<RoomSpotifyTrack> {
  const data = await apiClientInstance.put(`/spotify/room/${user_id}`, request);
  return data;
}

export async function deleteRoomSpotifyTrack(
  user_id: string,
  apiClientInstance: any,
): Promise<void> {
  await apiClientInstance.delete(`/spotify/room/${user_id}`);
  // The response will be null for 204 status, which is expected
  return;
}

export async function deleteRoomSpotifyTrackByRoomId(
  room_id: string,
  apiClientInstance: any,
): Promise<void> {
  await apiClientInstance.delete(`/spotify/room/delete/${room_id}`);
  // The response will be null for 204 status, which is expected
  return;
}

// Spotify playback control functions
export async function playSpotifyTrack(
  user_id: string,
  track_uri: string,
  apiClientInstance: any,
): Promise<void> {
  await apiClientInstance.post('/spotify/play', { user_id, track_uri });
}

export async function pauseSpotifyPlayback(user_id: string, apiClientInstance: any): Promise<void> {
  await apiClientInstance.post('/spotify/pause', { user_id });
}

export async function skipToNextTrack(user_id: string, apiClientInstance: any): Promise<void> {
  await apiClientInstance.post('/spotify/next', { user_id });
}

export async function skipToPreviousTrack(user_id: string, apiClientInstance: any): Promise<void> {
  await apiClientInstance.post('/spotify/previous', { user_id });
}

export async function setPlaybackVolume(
  user_id: string,
  volume: number,
  apiClientInstance: any,
): Promise<void> {
  await apiClientInstance.post('/spotify/volume', { user_id, volume });
}

// Spotify user profile
export async function getSpotifyProfile(): Promise<{
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string; height: number; width: number }>;
}> {
  const data = await apiClient.get('/spotify/profile');
  return data;
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
  const data = await apiClient.get('/spotify/playlists');
  return data;
}

// Spotify user top tracks
export async function getUserTopTracks(): Promise<SpotifyTrack[]> {
  const data = await apiClient.get('/spotify/top-tracks');
  return data;
}

// Spotify user recently played
export async function getRecentlyPlayed(): Promise<SpotifyTrack[]> {
  const data = await apiClient.get('/spotify/recently-played');
  return data;
}
