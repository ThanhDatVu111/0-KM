import supabase from '../utils/supabase';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  uri: string;
}

export interface SpotifyPlaybackState {
  isPlaying: boolean;
  currentTrack?: SpotifyTrack;
  progress: number;
  volume: number;
}

class SpotifyService {
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  // Get Spotify access token from Supabase session
  private async getAccessToken(): Promise<string | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const spotifyProvider = session?.user?.app_metadata?.providers?.spotify;
      return spotifyProvider?.access_token || null;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      return null;
    }
  }

  // Make rate-limited request to Spotify API
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' = 'GET',
    body?: any,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = async () => {
        try {
          const token = await this.getAccessToken();
          if (!token) {
            throw new Error('No valid Spotify access token - please connect to Spotify first');
          }

          // Rate limiting: minimum 100ms between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < 100) {
            await new Promise((resolve) => setTimeout(resolve, 100 - timeSinceLastRequest));
          }
          this.lastRequestTime = Date.now();

          const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
          });

          if (response.status === 429) {
            // Rate limited - wait and retry
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            console.log(`🔄 Rate limited, waiting ${waitTime}ms before retry`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));

            // Retry the request
            const retryResponse = await fetch(`https://api.spotify.com/v1${endpoint}`, {
              method,
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: body ? JSON.stringify(body) : undefined,
            });

            if (!retryResponse.ok) {
              throw new Error(`Spotify API error: ${retryResponse.status}`);
            }

            const contentType = retryResponse.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              resolve(null);
              return;
            }

            const text = await retryResponse.text();
            if (!text) {
              resolve(null);
              return;
            }

            resolve(JSON.parse(text));
            return;
          }

          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              throw new Error('TOKEN_EXPIRED');
            }
            throw new Error(`Spotify API error: ${response.status}`);
          }

          // Handle empty responses
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            resolve(null);
            return;
          }

          const text = await response.text();
          if (!text) {
            resolve(null);
            return;
          }

          try {
            resolve(JSON.parse(text));
          } catch (error) {
            console.error('JSON parse error:', error, 'Response text:', text);
            reject(new Error(`Invalid JSON response: ${text}`));
          }
        } catch (error) {
          reject(error);
        }
      };

      // Add to queue and process
      this.requestQueue.push(request);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Request failed:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  // Search for tracks
  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    try {
      const data: any = await this.makeRequest(
        `/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      );

      if (!data?.tracks?.items) {
        return [];
      }

      return data.tracks.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        albumArt: track.album?.images[0]?.url || '',
        duration: Math.floor(track.duration_ms / 1000),
        uri: track.uri,
      }));
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  // Get current playback state
  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    try {
      const data: any = await this.makeRequest('/me/player');

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
    } catch (error) {
      throw error;
    }
  }

  // Play/pause current track
  async togglePlayPause(): Promise<void> {
    try {
      const state = await this.getPlaybackState();
      if (state?.isPlaying) {
        await this.makeRequest('/me/player/pause', 'PUT');
      } else {
        await this.makeRequest('/me/player/play', 'PUT');
      }
    } catch (error) {
      throw error;
    }
  }

  // Skip to next track
  async skipToNext(): Promise<void> {
    try {
      await this.makeRequest('/me/player/next', 'POST');
    } catch (error) {
      throw error;
    }
  }

  // Skip to previous track
  async skipToPrevious(): Promise<void> {
    try {
      await this.makeRequest('/me/player/previous', 'POST');
    } catch (error) {
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
    } catch (error) {
      throw error;
    }
  }

  // Seek to position in track (milliseconds)
  async seekToPosition(positionMs: number): Promise<void> {
    try {
      await this.makeRequest(`/me/player/seek?position_ms=${positionMs}`, 'PUT');
    } catch (error) {
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
}

// Export singleton instance
export const spotifyService = new SpotifyService();
