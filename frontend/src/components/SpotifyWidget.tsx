import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spotifyAPI, SpotifyTrack, SpotifyPlaybackState } from '@/apis/spotify';
import { PlaylistSelector } from './PlaylistSelector';
import { LinearGradient } from 'expo-linear-gradient';

interface SpotifyWidgetProps {
  roomId?: string;
  isHost?: boolean;
  onSync?: (state: any) => void;
}

export const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ roomId, isHost = false, onSync }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'recent' | 'top'>('current');
  const [isPlaying, setIsPlaying] = useState(false);

  const syncInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Spotify authentication
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Set up sync for current track
  useEffect(() => {
    if (isAuthenticated && currentTrack && isHost && onSync) {
      syncInterval.current = setInterval(() => {
        const syncState = {
          trackUri: currentTrack.uri,
          trackName: currentTrack.name,
          artistName: currentTrack.artists.map((artist) => artist.name).join(', '),
          albumName: currentTrack.album.name,
          albumArt: currentTrack.album.images?.[0]?.url,
          timestamp: Date.now(),
        };
        onSync(syncState);
      }, 10000); // Sync every 10 seconds
    }

    return () => {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
    };
  }, [isAuthenticated, currentTrack, isHost, onSync]);

  // Poll for current playback state
  useEffect(() => {
    if (isAuthenticated) {
      const pollInterval = setInterval(() => {
        fetchCurrentPlayback();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    }
  }, [isAuthenticated]);

  const checkAuthentication = async () => {
    const authenticated = spotifyAPI.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      await loadUserData();
    }
  };

  const loadUserData = async () => {
    await Promise.all([fetchCurrentPlayback(), fetchRecentTracks(), fetchTopTracks()]);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await spotifyAPI.authenticate();
      if (success) {
        setIsAuthenticated(true);
        await loadUserData();
      } else {
        Alert.alert('Authentication Failed', 'Unable to connect to Spotify');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate with Spotify');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentPlayback = async () => {
    try {
      const state = await spotifyAPI.getCurrentPlayback();
      if (state) {
        setPlaybackState(state);
        setCurrentTrack(state.item);
        setIsPlaying(state.is_playing);
      } else {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Failed to fetch playback state:', error);
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  const fetchRecentTracks = async () => {
    try {
      const tracks = await spotifyAPI.getRecentlyPlayed(10);
      setRecentTracks(tracks);
    } catch (error) {
      console.error('Failed to fetch recent tracks:', error);
    }
  };

  const fetchTopTracks = async () => {
    try {
      const tracks = await spotifyAPI.getTopTracks('medium_term', 10);
      setTopTracks(tracks);
    } catch (error) {
      console.error('Failed to fetch top tracks:', error);
    }
  };

  const handleTrackPress = (track: SpotifyTrack) => {
    spotifyAPI.openTrackInSpotify(track.uri);
  };

  const handlePlaylistSelect = (playlistId: string) => {
    console.log('Selected playlist:', playlistId);
  };

  const getAlbumArt = (track: SpotifyTrack) => {
    if (track?.album?.images && track.album.images.length > 0) {
      return track.album.images[0].url;
    }
    return undefined;
  };

  const renderTrackItem = (track: SpotifyTrack, index: number) => (
    <TouchableOpacity
      key={track.id}
      style={styles.trackItem}
      onPress={() => handleTrackPress(track)}
    >
      <Image
        source={{ uri: getAlbumArt(track) }}
        style={styles.trackImage}
        defaultSource={require('@/assets/images/blue book.png')}
      />
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {track.artists.map((artist) => artist.name).join(', ')}
        </Text>
      </View>
      <Ionicons name="open-outline" size={20} color="#1DB954" />
    </TouchableOpacity>
  );

  // Add a themed card wrapper for the widget
  const ThemedCard: React.FC<{ children: React.ReactNode; style?: any }> = ({
    children,
    style,
  }) => (
    <View
      style={[
        {
          borderWidth: 1.5,
          borderColor: 'black',
          borderRadius: 16,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['#6536DA', '#F7BFF7']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ ...StyleSheet.absoluteFillObject, borderRadius: 16, zIndex: -1 }}
      />
      <View style={{ padding: 16, minHeight: 180, justifyContent: 'center' }}>{children}</View>
    </View>
  );

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <ThemedCard>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="musical-notes" size={48} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>
            Connect your Spotify
          </Text>
          <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 16 }}>
            Sign in to share music and discover what your partner is listening to
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#1DB954',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 24,
              marginTop: 8,
            }}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                Sign in to Spotify
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ThemedCard>
    );
  }

  // Authenticated but no music playing
  if (!currentTrack) {
    return (
      <ThemedCard>
        <View style={styles.authContainer}>
          <Ionicons name="musical-notes" size={48} color="#1DB954" />
          <Text style={styles.authTitle}>Listen to music together</Text>
          <Text style={styles.authSubtitle}>
            Start playing music on Spotify to share what you're listening to with your partner
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => spotifyAPI.openTrackInSpotify('spotify:app:home')}
          >
            <Ionicons name="play-circle" size={20} color="#1DB954" />
            <Text style={styles.secondaryButtonText}>Open Spotify</Text>
          </TouchableOpacity>
        </View>
      </ThemedCard>
    );
  }

  // Music is playing - show current track
  return (
    <ThemedCard>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Now Playing</Text>
        {isHost && (
          <TouchableOpacity
            style={styles.playlistButton}
            onPress={() => setShowPlaylistSelector(true)}
          >
            <Ionicons name="list" size={16} color="white" />
            <Text style={styles.playlistButtonText}>Playlists</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Current Track Display */}
      <View style={styles.currentTrackContainer}>
        <Image
          source={{ uri: getAlbumArt(currentTrack) }}
          style={styles.currentTrackImage}
          defaultSource={require('@/assets/images/blue book.png')}
        />
        <View style={styles.currentTrackInfo}>
          <Text style={styles.currentTrackName} numberOfLines={2}>
            {currentTrack.name}
          </Text>
          <Text style={styles.currentTrackArtist} numberOfLines={1}>
            {currentTrack.artists.map((artist) => artist.name).join(', ')}
          </Text>
          <Text style={styles.currentTrackAlbum} numberOfLines={1}>
            {currentTrack.album.name}
          </Text>
          <View style={styles.playingIndicator}>
            <Ionicons name={isPlaying ? 'play-circle' : 'pause-circle'} size={16} color="#1DB954" />
            <Text style={styles.playingText}>{isPlaying ? 'Now playing' : 'Paused'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.openButton} onPress={() => handleTrackPress(currentTrack)}>
          <Ionicons name="open-outline" size={24} color="#1DB954" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'top' && styles.activeTab]}
          onPress={() => setActiveTab('top')}
        >
          <Text style={[styles.tabText, activeTab === 'top' && styles.activeTabText]}>
            Top Tracks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'recent' && (
          <View>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            {recentTracks.map((track, index) => renderTrackItem(track, index))}
          </View>
        )}

        {activeTab === 'top' && (
          <View>
            <Text style={styles.sectionTitle}>Your Top Tracks</Text>
            {topTracks.map((track, index) => renderTrackItem(track, index))}
          </View>
        )}
      </ScrollView>

      {/* Host Indicator */}
      {isHost && (
        <View style={styles.hostIndicator}>
          <Ionicons name="radio" size={12} color="#1DB954" />
          <Text style={styles.hostText}>You're sharing your music</Text>
        </View>
      )}

      {/* Playlist Selector Modal */}
      <PlaylistSelector
        isVisible={showPlaylistSelector}
        onClose={() => setShowPlaylistSelector(false)}
        onPlaylistSelect={handlePlaylistSelect}
        isHost={isHost}
      />
    </ThemedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 500,
  },
  authContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  authSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#1DB954',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  playlistButton: {
    backgroundColor: '#1DB954',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  playlistButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1DB954',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  currentTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  currentTrackImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  currentTrackInfo: {
    flex: 1,
  },
  currentTrackName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  currentTrackArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  currentTrackAlbum: {
    fontSize: 12,
    color: '#999',
  },
  openButton: {
    padding: 8,
  },
  noTrackContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTrackText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  noTrackSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  artistName: {
    fontSize: 12,
    color: '#666',
  },
  hostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  hostText: {
    fontSize: 12,
    color: '#1DB954',
    fontWeight: '500',
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  playingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1DB954',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});
