import * as SecureStore from 'expo-secure-store';

interface YouTubePlaybackState {
  isPlaying: boolean;
  currentVideo?: {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: number;
    url: string;
  };
  progress: number;
  volume: number;
}

class YouTubePlaybackService {
  private apiKey: string | null = null;

  async initialize() {
    // For YouTube, we'll use the YouTube Data API key
    this.apiKey = await SecureStore.getItemAsync('youtube_api_key');
  }

  private async getValidApiKey(): Promise<string | null> {
    if (!this.apiKey) {
      await this.initialize();
    }
    return this.apiKey;
  }

  private async makeRequest(endpoint: string, params: Record<string, string> = {}) {
    const apiKey = await this.getValidApiKey();
    if (!apiKey) {
      throw new Error('No valid YouTube API key');
    }

    const queryParams = new URLSearchParams({
      key: apiKey,
      ...params,
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3${endpoint}?${queryParams}`);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    return response.json();
  }

  // Get video details
  async getVideoDetails(videoId: string): Promise<any> {
    try {
      const data = await this.makeRequest('/videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoId,
      });

      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
        duration: this.parseDuration(video.contentDetails.duration),
        url: `https://www.youtube.com/watch?v=${video.id}`,
      };
    } catch (error) {
      console.error('Error getting video details:', error);
      throw error;
    }
  }

  // Parse YouTube duration format (PT4M13S -> 253 seconds)
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  // Search for videos
  async searchVideos(query: string, maxResults: number = 10): Promise<any[]> {
    try {
      const data = await this.makeRequest('/search', {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        videoCategoryId: '10', // Music category
      });

      return data.items || [];
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  }

  // Get related videos
  async getRelatedVideos(videoId: string, maxResults: number = 10): Promise<any[]> {
    try {
      const data = await this.makeRequest('/search', {
        part: 'snippet',
        relatedToVideoId: videoId,
        type: 'video',
        maxResults: maxResults.toString(),
        videoCategoryId: '10', // Music category
      });

      return data.items || [];
    } catch (error) {
      console.error('Error getting related videos:', error);
      throw error;
    }
  }

  // Get video statistics
  async getVideoStatistics(videoId: string): Promise<any> {
    try {
      const data = await this.makeRequest('/videos', {
        part: 'statistics',
        id: videoId,
      });

      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }

      return data.items[0].statistics;
    } catch (error) {
      console.error('Error getting video statistics:', error);
      throw error;
    }
  }

  // Get channel details
  async getChannelDetails(channelId: string): Promise<any> {
    try {
      const data = await this.makeRequest('/channels', {
        part: 'snippet,statistics',
        id: channelId,
      });

      if (!data.items || data.items.length === 0) {
        throw new Error('Channel not found');
      }

      return data.items[0];
    } catch (error) {
      console.error('Error getting channel details:', error);
      throw error;
    }
  }

  // Get trending music videos
  async getTrendingMusicVideos(regionCode: string = 'US', maxResults: number = 20): Promise<any[]> {
    try {
      const data = await this.makeRequest('/videos', {
        part: 'snippet,contentDetails,statistics',
        chart: 'mostPopular',
        videoCategoryId: '10', // Music category
        regionCode,
        maxResults: maxResults.toString(),
      });

      return data.items || [];
    } catch (error) {
      console.error('Error getting trending music videos:', error);
      throw error;
    }
  }

  // Get playlist items
  async getPlaylistItems(playlistId: string, maxResults: number = 50): Promise<any[]> {
    try {
      const data = await this.makeRequest('/playlistItems', {
        part: 'snippet,contentDetails',
        playlistId,
        maxResults: maxResults.toString(),
      });

      return data.items || [];
    } catch (error) {
      console.error('Error getting playlist items:', error);
      throw error;
    }
  }

  // Get video comments
  async getVideoComments(videoId: string, maxResults: number = 20): Promise<any[]> {
    try {
      const data = await this.makeRequest('/commentThreads', {
        part: 'snippet',
        videoId,
        maxResults: maxResults.toString(),
        order: 'relevance',
      });

      return data.items || [];
    } catch (error) {
      console.error('Error getting video comments:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const youtubePlayback = new YouTubePlaybackService();
