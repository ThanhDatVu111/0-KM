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
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

export class SpotifyService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  async authenticate(): Promise<boolean> {
    try {
      // 1. Generate PKCE code verifier & challenge
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      // 2. Build the auth URL
      const authUrl =
        `https://accounts.spotify.com/authorize?` +
        `client_id=${SPOTIFY_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(SPOTIFY_SCOPES)}` +
        `&code_challenge_method=S256` +
        `&code_challenge=${codeChallenge}` +
        `&state=${this.generateState()}`;

      console.log('🔗 Auth URL:', authUrl);

      // 3. Open the browser for user login
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      console.log('🌐 Auth result:', result.type);

      if (result.type !== 'success') {
        console.log('❌ Auth failed or cancelled');
        return false;
      }

      // TypeScript fix: check if result has url property
      if (!('url' in result) || !result.url) {
        console.log('❌ No URL in auth result');
        return false;
      }

      // 4. Extract the authorization code
      const returnedUrl = new URL(result.url);
      const code = returnedUrl.searchParams.get('code');
      const state = returnedUrl.searchParams.get('state');
      const error = returnedUrl.searchParams.get('error');

      if (error) {
        console.error('❌ Spotify auth error:', error);
        return false;
      }

      if (!code) {
        console.error('❌ No authorization code received');
        return false;
      }

      console.log('✅ Got authorization code, exchanging for token...');

      // 5. Exchange code for tokens
      await this.exchangeCodeForToken(code, codeVerifier);
      return true;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      return false;
    }
  }

  private generateCodeVerifier(): string {
    // Generate a random string for code verifier
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < 128; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    // Use Expo Crypto for SHA-256
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 },
    );

    // Convert to base64url format
    return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64URLEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
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

    console.log('🔄 Exchanging code for token...');
    console.log('📝 Request body:', body);
    console.log('🔗 Redirect URI:', redirectUri);
    console.log('🆔 Client ID:', SPOTIFY_CLIENT_ID);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });

    const data = await response.json();
    console.log('📡 Token response status:', response.status);
    console.log('📡 Token response headers:', Object.fromEntries(response.headers.entries()));
    console.log('📡 Token response data:', data);

    if (!response.ok) {
      console.error('❌ Token exchange failed:', data);
      console.error('❌ Response status:', response.status);
      console.error('❌ Response status text:', response.statusText);
      throw new Error(`Token exchange failed: ${data.error} - ${data.error_description || ''}`);
    }

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : null;

    console.log('✅ Token exchange successful');
    console.log('✅ Access token length:', this.accessToken?.length);
    console.log('✅ Refresh token length:', this.refreshToken?.length);
    console.log('✅ Expires at:', this.expiresAt);
  }

  async getRecentlyPlayed(): Promise<SpotifyTrack | null> {
    if (!this.accessToken) return null;

    try {
      const resp = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!resp.ok) {
        console.error('❌ Spotify API error:', resp.status, resp.statusText);
        if (resp.status === 401 || resp.status === 403) {
          // Token might be expired, clear it
          this.accessToken = null;
          this.refreshToken = null;
          this.expiresAt = null;
        }
        return null;
      }

      const data = await resp.json();
      return data.items?.[0]?.track || null;
    } catch (error) {
      console.error('❌ Error fetching recently played:', error);
      return null;
    }
  }

  async getCurrentPlayback(): Promise<SpotifyPlaybackState | null> {
    // This method is kept for backward compatibility but will always return null
    // since free accounts can't access currently playing
    console.warn('⚠️ getCurrentPlayback is not available for free Spotify accounts');
    return null;
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

  getRefreshToken() {
    return this.refreshToken;
  }

  getExpiresAt() {
    return this.expiresAt;
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }
}

export const spotifyService = new SpotifyService();
