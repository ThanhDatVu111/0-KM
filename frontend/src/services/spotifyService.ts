import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { SpotifyTrack, SpotifyPlaybackState, SpotifyPlaylist } from '@/types/spotify';

// Spotify configuration
const SPOTIFY_CLIENT_ID = 'f805d2782059483e801da7782a7e04c8'; // Replace with your actual client ID
const SPOTIFY_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: '0km-app',
  path: 'spotify-callback',
});

const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

class SpotifyService {
  private accessToken: string | null = null;

  // Simple authentication
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
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

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
      const response = await fetch('https://accounts.spotify.com/api/token', {
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
      } else {
        throw new Error(`Token exchange failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  // Get current playback state
  async getCurrentPlayback(): Promise<SpotifyPlaybackState | null> {
    if (!this.accessToken) return null;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to get current playback:', error);
      return null;
    }
  }

  // Search tracks
  async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
    if (!this.accessToken) return [];

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } },
      );

      const data = await response.json();
      return data.tracks?.items || [];
    } catch (error) {
      console.error('Failed to search tracks:', error);
      return [];
    }
  }

  // Create playlist
  async createPlaylist(name: string, isPublic: boolean = false): Promise<SpotifyPlaylist | null> {
    if (!this.accessToken) return null;

    try {
      // Get current user
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const user = await userResponse.json();

      // Create playlist
      const response = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, public: isPublic }),
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to create playlist:', error);
      return null;
    }
  }

  // Add tracks to playlist
  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: trackUris }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to add tracks to playlist:', error);
      return false;
    }
  }

  // Open track in Spotify
  openTrackInSpotify(trackUri: string): void {
    const spotifyUrl = trackUri.replace('spotify:track:', 'https://open.spotify.com/track/');
    Linking.openURL(spotifyUrl);
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Logout
  logout(): void {
    this.accessToken = null;
  }
}

export const spotifyService = new SpotifyService();
