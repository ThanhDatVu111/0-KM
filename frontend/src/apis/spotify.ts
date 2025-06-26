import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { SPOTIFY_CONFIG } from '@/constants/spotify';

// Spotify API configuration
const SPOTIFY_CLIENT_ID = SPOTIFY_CONFIG.CLIENT_ID;

// Try to get redirect URI dynamically, fallback to hardcoded
let SPOTIFY_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: '0km-app',
  path: 'spotify-callback',
});

// If the dynamic URI is empty, use a hardcoded one
if (!SPOTIFY_REDIRECT_URI) {
  SPOTIFY_REDIRECT_URI = '0km-app://spotify-callback';
}

// Log the redirect URI for debugging
console.log('Spotify Redirect URI:', SPOTIFY_REDIRECT_URI);

// Alternative redirect URI for testing
const ALTERNATIVE_REDIRECT_URI = '0km-app://spotify-callback';
console.log('Alternative Redirect URI:', ALTERNATIVE_REDIRECT_URI);

// Spotify API endpoints
const SPOTIFY_API_BASE = SPOTIFY_CONFIG.API_BASE;
const SPOTIFY_AUTH_URL = SPOTIFY_CONFIG.AUTH_URL;
const SPOTIFY_TOKEN_URL = SPOTIFY_CONFIG.TOKEN_URL;

// Scopes for free accounts (read-only access)
const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-recently-played',
  'user-top-read',
].join(' ');

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  duration_ms: number;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  device: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string; width: number; height: number }>;
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

class SpotifyAPI {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Initialize Spotify authentication
  async authenticate(): Promise<boolean> {
    try {
      // Generate PKCE challenge
      const codeVerifier = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        { encoding: Crypto.CryptoEncoding.BASE64 },
      );

      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 },
      );

      // Create auth request
      const authUrl = `${SPOTIFY_AUTH_URL}?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(authUrl, SPOTIFY_REDIRECT_URI);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          await this.exchangeCodeForToken(code, codeVerifier);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      return false;
    }
  }

  // Exchange authorization code for access token
  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<void> {
    try {
      console.log(
        'Token exchange body:',
        new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          code_verifier: codeVerifier,
        }).toString(),
      );

      const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          code_verifier: codeVerifier,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiry = Date.now() + data.expires_in * 1000;
      } else {
        throw new Error(`Token exchange failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + data.expires_in * 1000;

        if (data.refresh_token) {
          this.refreshToken = data.refresh_token;
        }
      } else {
        throw new Error(`Token refresh failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Ensure we have a valid access token
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
      await this.refreshAccessToken();
    }
  }

  // Make authenticated API request
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.ensureValidToken();

    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get current playback state (read-only)
  async getCurrentPlayback(): Promise<SpotifyPlaybackState | null> {
    try {
      return await this.makeRequest('/me/player');
    } catch (error) {
      console.error('Get playback error:', error);
      return null;
    }
  }

  // Get user's recently played tracks
  async getRecentlyPlayed(limit: number = 20): Promise<SpotifyTrack[]> {
    try {
      const response = await this.makeRequest(`/me/player/recently-played?limit=${limit}`);
      return response.items?.map((item: any) => item.track) || [];
    } catch (error) {
      console.error('Get recently played error:', error);
      return [];
    }
  }

  // Get user's top tracks
  async getTopTracks(
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit: number = 20,
  ): Promise<SpotifyTrack[]> {
    try {
      const response = await this.makeRequest(
        `/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
      );
      return response.items || [];
    } catch (error) {
      console.error('Get top tracks error:', error);
      return [];
    }
  }

  // Get user's playlists
  async getPlaylists(): Promise<SpotifyPlaylist[]> {
    try {
      const response = await this.makeRequest('/me/playlists?limit=50');
      return response.items || [];
    } catch (error) {
      console.error('Get playlists error:', error);
      return [];
    }
  }

  // Get playlist tracks
  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    try {
      const response = await this.makeRequest(`/playlists/${playlistId}/tracks?limit=100`);
      return response.items?.map((item: any) => item.track) || [];
    } catch (error) {
      console.error('Get playlist tracks error:', error);
      return [];
    }
  }

  // Search for tracks
  async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
    try {
      const response = await this.makeRequest(
        `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      );
      return response.tracks?.items || [];
    } catch (error) {
      console.error('Search tracks error:', error);
      return [];
    }
  }

  // Get track details
  async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    try {
      return await this.makeRequest(`/tracks/${trackId}`);
    } catch (error) {
      console.error('Get track error:', error);
      return null;
    }
  }

  // Get recommendations based on track
  async getRecommendations(trackIds: string[], limit: number = 20): Promise<SpotifyTrack[]> {
    try {
      const seedTracks = trackIds.slice(0, 5).join(','); // Max 5 seed tracks
      const response = await this.makeRequest(
        `/recommendations?seed_tracks=${seedTracks}&limit=${limit}`,
      );
      return response.tracks || [];
    } catch (error) {
      console.error('Get recommendations error:', error);
      return [];
    }
  }

  // Open track in Spotify app
  openTrackInSpotify(trackUri: string): void {
    const spotifyUrl = trackUri.replace('spotify:track:', 'https://open.spotify.com/track/');
    WebBrowser.openBrowserAsync(spotifyUrl);
  }

  // Open playlist in Spotify app
  openPlaylistInSpotify(playlistUrl: string): void {
    WebBrowser.openBrowserAsync(playlistUrl);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Logout
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }
}

export const spotifyAPI = new SpotifyAPI();
