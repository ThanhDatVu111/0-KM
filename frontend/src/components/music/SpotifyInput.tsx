import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/clerk-expo';
import { spotifyService } from '../../services/spotifyService';
import { useSharedSpotifyTrack } from '../../hooks/useSharedSpotifyTrack';
import { useAuth } from '@clerk/clerk-expo';

type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  uri: string;
};

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onTrackAdded: () => void;
};

export function SpotifyInput({ isVisible, onClose, onTrackAdded }: Props) {
  const { userId } = useAuth();
  const { updateTrack } = useSharedSpotifyTrack(null); // We'll get roomId from context or props
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await spotifyService.searchTracks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search Spotify tracks:', error);
      Alert.alert('Error', 'Failed to search for tracks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrack = async (track: SpotifyTrack) => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to add tracks.');
      return;
    }

    setIsAdding(true);
    try {
      await updateTrack({
        track_uri: track.uri,
        track_name: track.name,
        artist_name: track.artist,
        album_name: track.album,
        album_art_url: track.albumArt,
        duration_ms: track.duration * 1000, // Convert to milliseconds
        is_playing: true,
      });

      Alert.alert('Success', 'Track added successfully!');
      onTrackAdded();
      onClose();
    } catch (error: any) {
      console.error('Failed to add track:', error);
      Alert.alert('Error', error.message || 'Failed to add track. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const renderTrackItem = ({ item }: { item: SpotifyTrack }) => (
    <TouchableOpacity
      style={styles.trackItem}
      onPress={() => handleAddTrack(item)}
      disabled={isAdding}
    >
      <Image source={{ uri: item.albumArt }} style={styles.trackAlbumArt} />
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist}
        </Text>
        <Text style={styles.trackAlbum} numberOfLines={1}>
          {item.album}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddTrack(item)}
        disabled={isAdding}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <LinearGradient colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']} style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="musical-notes" size={24} color="#1DB954" />
              <Text style={styles.title}>Add Spotify Track</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#b3b3b3" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a song, artist, or album..."
                placeholderTextColor="#b3b3b3"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Ionicons name="musical-notes" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1DB954" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {/* Search Results */}
          {!isLoading && searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              renderItem={renderTrackItem}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Empty State */}
          {!isLoading && searchQuery && searchResults.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color="#b3b3b3" />
              <Text style={styles.emptyText}>No tracks found</Text>
              <Text style={styles.emptySubtext}>Try searching for a different song or artist</Text>
            </View>
          )}

          {/* Initial State */}
          {!isLoading && !searchQuery && (
            <View style={styles.initialContainer}>
              <Ionicons name="musical-notes" size={48} color="#1DB954" />
              <Text style={styles.initialText}>Search for music to share</Text>
              <Text style={styles.initialSubtext}>
                Find your favorite songs and share them with your partner
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 12,
    paddingLeft: 0,
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: '#404040',
    borderRadius: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#1DB954',
    borderRadius: 25,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  resultsList: {
    flex: 1,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#404040',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackAlbumArt: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    color: '#1DB954',
    fontSize: 14,
    marginBottom: 2,
  },
  trackAlbum: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#1DB954',
    borderRadius: 20,
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  initialSubtext: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
