import * as SecureStore from 'expo-secure-store';

interface SpotifyPlaybackState {
  isPlaying: boolean;
  currentTrack?: {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    duration: number;
    uri: string;
  };
  progress: number;
  volume: number;
}

class SpotifyPlaybackService {
  private accessToken: string | null = null;

  async initialize() {
    this.accessToken = await SecureStore.getItemAsync('spotify_access_token');
  }

  private async getValidToken(): Promise<string | null> {
    if (!this.accessToken) {
      await this.initialize();
    }

    // Check if token is expired and refresh if needed
    const tokenExpiry = await SecureStore.getItemAsync('spotify_token_expiry');
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      console.log('🔄 Spotify token expired, refreshing...');
      await this.refreshToken();
    }

    return this.accessToken;
  }

  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync('spotify_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' + btoa('f805d2782059483e801da7782a7e04c8:06b28132afaf4c0b9c1f3224c268c35b'),
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(`Token refresh failed: ${data.error}`);
      }

      // Store new tokens
      await SecureStore.setItemAsync('spotify_access_token', data.access_token);
      if (data.refresh_token) {
        await SecureStore.setItemAsync('spotify_refresh_token', data.refresh_token);
      }
      await SecureStore.setItemAsync(
        'spotify_token_expiry',
        (Date.now() + (data.expires_in || 3600) * 1000).toString(),
      );

      this.accessToken = data.access_token;
      console.log('✅ Spotify token refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh Spotify token:', error);
      // Clear invalid tokens
      await SecureStore.deleteItemAsync('spotify_access_token');
      await SecureStore.deleteItemAsync('spotify_refresh_token');
      await SecureStore.deleteItemAsync('spotify_token_expiry');
      this.accessToken = null;
      throw error;
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: any) {
    const token = await this.getValidToken();
    if (!token) {
      throw new Error('No valid Spotify access token');
    }

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    // Handle empty responses (like for PUT/POST requests)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null; // No JSON to parse
    }

    const text = await response.text();
    if (!text) {
      return null; // Empty response
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON parse error:', error, 'Response text:', text);
      throw new Error(`Invalid JSON response: ${text}`);
    }
  }

  // Get current playback state
  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    try {
      const data = await this.makeRequest('/me/player');

      if (!data || !data.is_playing) {
        return {
          isPlaying: false,
          progress: 0,
          volume: 50,
        };
      }

      return {
        isPlaying: data.is_playing,
        currentTrack: data.item
          ? {
              id: data.item.id,
              name: data.item.name,
              artist: data.item.artists[0]?.name || 'Unknown Artist',
              album: data.item.album?.name || 'Unknown Album',
              albumArt: data.item.album?.images[0]?.url || '',
              duration: Math.floor(data.item.duration_ms / 1000),
              uri: data.item.uri,
            }
          : undefined,
        progress: data.progress_ms || 0,
        volume: data.device?.volume_percent || 50,
      };
    } catch (error) {
      console.error('Error getting playback state:', error);
      return null;
    }
  }

  // Play a specific track
  async playTrack(trackUri: string): Promise<void> {
    try {
      await this.makeRequest('/me/player/play', 'PUT', {
        uris: [trackUri],
      });
      console.log('🎵 Started playing track:', trackUri);
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  }

  // Play/pause current track
  async togglePlayPause(): Promise<void> {
    try {
      const state = await this.getPlaybackState();
      if (state?.isPlaying) {
        await this.makeRequest('/me/player/pause', 'PUT');
        console.log('⏸️ Paused playback');
      } else {
        await this.makeRequest('/me/player/play', 'PUT');
        console.log('▶️ Resumed playback');
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      throw error;
    }
  }

  // Skip to next track
  async skipToNext(): Promise<void> {
    try {
      await this.makeRequest('/me/player/next', 'POST');
      console.log('⏭️ Skipped to next track');
    } catch (error) {
      console.error('Error skipping to next:', error);
      throw error;
    }
  }

  // Skip to previous track
  async skipToPrevious(): Promise<void> {
    try {
      await this.makeRequest('/me/player/previous', 'POST');
      console.log('⏮️ Skipped to previous track');
    } catch (error) {
      console.error('Error skipping to previous:', error);
      throw error;
    }
  }

  // Set volume (0-100)
  async setVolume(volume: number): Promise<void> {
    try {
      await this.makeRequest(
        `/me/player/volume?volume_percent=${Math.max(0, Math.min(100, volume))}`,
        'PUT',
      );
      console.log('🔊 Set volume to:', volume);
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }

  // Seek to position in track (seconds)
  async seekToPosition(positionMs: number): Promise<void> {
    try {
      await this.makeRequest(`/me/player/seek?position_ms=${positionMs}`, 'PUT');
      console.log('⏱️ Seeked to position:', positionMs);
    } catch (error) {
      console.error('Error seeking:', error);
      throw error;
    }
  }

  // Get available devices
  async getDevices(): Promise<any[]> {
    try {
      const data = await this.makeRequest('/me/player/devices');
      return data.devices || [];
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  }

  // Transfer playback to a specific device
  async transferPlayback(deviceId: string): Promise<void> {
    try {
      await this.makeRequest('/me/player', 'PUT', {
        device_ids: [deviceId],
        play: true,
      });
      console.log('📱 Transferred playback to device:', deviceId);
    } catch (error) {
      console.error('Error transferring playback:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const spotifyPlayback = new SpotifyPlaybackService();
