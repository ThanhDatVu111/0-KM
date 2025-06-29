import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { SpotifyTrack, SpotifyPlaybackState, SpotifyPlaylist } from '@/types/spotify';

// Complete any pending auth session
WebBrowser.maybeCompleteAuthSession();

// Generate a redirect URI that works in Expo Go and standalone
const redirectUri = (AuthSession.makeRedirectUri as any)({
  scheme: '0km-app',
  useProxy: true,
});
console.log('▶️ Using redirectUri =', redirectUri);

const SPOTIFY_CLIENT_ID = 'f805d2782059483e801da7782a7e04c8';
const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

export class SpotifyService {
  private accessToken: string | null = null;

  async authenticate(): Promise<boolean> {
    try {
      // 1. Generate PKCE code verifier & challenge
      const codeVerifier = await Crypto.randomUUID();
      const codeChallengeBuffer = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 },
      );
      const codeChallenge = codeChallengeBuffer
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 2. Build the auth URL
      const authUrl =
        `https://accounts.spotify.com/authorize?` +
        `client_id=${SPOTIFY_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(SPOTIFY_SCOPES)}` +
        `&code_challenge_method=S256` +
        `&code_challenge=${codeChallenge}`;

      // 3. Open the browser for user login
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type !== 'success' || !result.url) return false;

      // 4. Extract the authorization code
      const returnedUrl = new URL(result.url);
      const code = returnedUrl.searchParams.get('code');
      if (!code) return false;

      // 5. Exchange code for tokens
      await this.exchangeCodeForToken(code, codeVerifier);
      return true;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      return false;
    }
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string) {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: SPOTIFY_CLIENT_ID,
      code_verifier: codeVerifier,
    }).toString();

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${data.error}`);
    }
    this.accessToken = data.access_token;
  }

  async getCurrentPlayback(): Promise<SpotifyPlaybackState | null> {
    if (!this.accessToken) return null;
    const resp = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (resp.status === 204) return null;
    return resp.json();
  }

  async searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
    if (!this.accessToken) return [];
    const resp = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } },
    );
    const data = await resp.json();
    return data.tracks?.items || [];
  }

  async createPlaylist(name: string, isPublic = false): Promise<SpotifyPlaylist | null> {
    if (!this.accessToken) return null;
    const userResp = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    const user = await userResp.json();
    const resp = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, public: isPublic }),
    });
    return resp.ok ? resp.json() : null;
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<boolean> {
    if (!this.accessToken) return false;
    const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: trackUris }),
    });
    return resp.ok;
  }

  openTrackInSpotify(trackUri: string) {
    const url = trackUri.replace('spotify:track:', 'https://open.spotify.com/track/');
    Linking.openURL(url);
  }

  isAuthenticated() {
    return Boolean(this.accessToken);
  }

  getAccessToken() {
    return this.accessToken;
  }

  logout() {
    this.accessToken = null;
  }
}

export const spotifyService = new SpotifyService();
