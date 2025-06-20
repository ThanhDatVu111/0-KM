import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spotifyAPI, SpotifyPlaylist } from '@/apis/spotify';

interface PlaylistSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onPlaylistSelect?: (playlistId: string) => void;
  isHost?: boolean;
}

export const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({
  isVisible,
  onClose,
  onPlaylistSelect,
  isHost = false,
}) => {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadPlaylists();
    }
  }, [isVisible]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const userPlaylists = await spotifyAPI.getPlaylists();
      setPlaylists(userPlaylists);
    } catch (error) {
      Alert.alert('Error', 'Failed to load playlists');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaylistPress = async (playlist: SpotifyPlaylist) => {
    if (!isHost) {
      Alert.alert('Not Available', 'Only the host can share playlists');
      return;
    }

    try {
      // Open playlist in Spotify app
      spotifyAPI.openPlaylistInSpotify(playlist.external_urls.spotify);

      if (onPlaylistSelect) {
        onPlaylistSelect(playlist.id);
      }

      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to open playlist');
    }
  };

  const renderPlaylistItem = ({ item }: { item: SpotifyPlaylist }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => handlePlaylistPress(item)}
      disabled={!isHost}
    >
      <View style={styles.playlistImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0].url }} style={styles.playlistImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="musical-notes" size={24} color="#666" />
          </View>
        )}
      </View>

      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.playlistDescription} numberOfLines={2}>
          {item.description || `${item.tracks.total} tracks`}
        </Text>
      </View>

      {isHost && <Ionicons name="open-outline" size={24} color="#1DB954" />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Playlists</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
            <Text style={styles.loadingText}>Loading playlists...</Text>
          </View>
        ) : (
          <FlatList
            data={playlists}
            renderItem={renderPlaylistItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!isHost && (
          <View style={styles.hostOnlyMessage}>
            <Ionicons name="information-circle" size={16} color="#666" />
            <Text style={styles.hostOnlyText}>Only the host can share playlists</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playlistImageContainer: {
    marginRight: 16,
  },
  playlistImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  playlistDescription: {
    fontSize: 14,
    color: '#666',
  },
  hostOnlyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  hostOnlyText: {
    fontSize: 14,
    color: '#666',
  },
});
