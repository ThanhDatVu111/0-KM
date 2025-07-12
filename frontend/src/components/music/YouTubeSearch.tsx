import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { youtubePlayback } from '../../services/YouTubePlaybackService';

interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  url: string;
}

interface Props {
  onVideoSelect: (video: YouTubeVideo) => void;
  onCancel: () => void;
}

export function YouTubeSearch({ onVideoSelect, onCancel }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  useEffect(() => {
    loadTrendingVideos();
  }, []);

  const loadTrendingVideos = async () => {
    try {
      setIsLoadingTrending(true);
      const videos = await youtubePlayback.getTrendingMusicVideos('US', 20);
      setTrendingVideos(videos);
    } catch (error) {
      console.error('Error loading trending videos:', error);
      Alert.alert('Error', 'Failed to load trending music videos');
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const results = await youtubePlayback.searchVideos(searchQuery, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching videos:', error);
      Alert.alert('Error', 'Failed to search videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSelect = async (video: any) => {
    try {
      // Get full video details
      const videoDetails = await youtubePlayback.getVideoDetails(video.id.videoId);

      const selectedVideo: YouTubeVideo = {
        id: videoDetails.id,
        title: videoDetails.title,
        channel: videoDetails.channel,
        thumbnail: videoDetails.thumbnail,
        duration: videoDetails.duration,
        url: videoDetails.url,
      };

      onVideoSelect(selectedVideo);
    } catch (error) {
      console.error('Error getting video details:', error);
      Alert.alert('Error', 'Failed to get video details');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoItem = ({ item }: { item: any }) => {
    const videoId = item.id?.videoId || item.id;
    const thumbnail = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url;
    const title = item.snippet?.title || '';
    const channel = item.snippet?.channelTitle || '';
    const duration = item.contentDetails?.duration
      ? youtubePlayback['parseDuration'](item.contentDetails.duration)
      : 0;

    return (
      <TouchableOpacity
        onPress={() => handleVideoSelect(item)}
        style={{
          flexDirection: 'row',
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Image
          source={{ uri: thumbnail }}
          style={{
            width: 80,
            height: 60,
            borderRadius: 8,
            marginRight: 12,
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <Text
            style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '500',
              marginBottom: 4,
            }}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={{
              color: '#FF0000',
              fontSize: 12,
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {channel}
          </Text>
          {duration > 0 && (
            <Text style={{ color: '#888', fontSize: 12 }}>{formatDuration(duration)}</Text>
          )}
        </View>
        <Ionicons name="play-circle-outline" size={24} color="#FF0000" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          paddingTop: 60,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <TouchableOpacity onPress={onCancel} style={{ marginRight: 12 }}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
          Search YouTube Music
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 25,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="search" size={20} color="#FF0000" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search for music videos..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{
              flex: 1,
              color: 'white',
              fontSize: 16,
              marginLeft: 12,
            }}
          />
          {isLoading && <ActivityIndicator size="small" color="#FF0000" />}
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={searchQuery.trim() ? searchResults : trendingVideos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id?.videoId || item.id}
        style={{ flex: 1 }}
        ListHeaderComponent={
          !searchQuery.trim() ? (
            <View style={{ padding: 16 }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                🎵 Trending Music Videos
              </Text>
              {isLoadingTrending && (
                <ActivityIndicator size="large" color="#FF0000" style={{ marginTop: 20 }} />
              )}
            </View>
          ) : (
            <View style={{ padding: 16 }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                Search Results
              </Text>
            </View>
          )
        }
        ListEmptyComponent={
          !isLoading && !isLoadingTrending ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Ionicons name="musical-notes" size={48} color="#FF0000" />
              <Text style={{ color: 'white', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                {searchQuery.trim()
                  ? 'No videos found. Try a different search term.'
                  : 'No trending videos available.'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
