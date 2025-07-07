import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SpotifyWidget } from './SpotifyWidget';
import { SpotifyInput } from './SpotifyInput';

// Sample track data for demo
const sampleTracks = [
  {
    id: '1',
    name: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273ce4f1737e8c849033b5df5a5',
    duration: 354,
    uri: 'spotify:track:3z8h0TU7ReDPLIbEnYhWZb',
  },
  {
    id: '2',
    name: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273ce4f1737e8c849033b5df5a5',
    duration: 391,
    uri: 'spotify:track:40riOy7x9W7udXy6SA5vKc',
  },
  {
    id: '3',
    name: 'Imagine',
    artist: 'John Lennon',
    album: 'Imagine',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273ce4f1737e8c849033b5df5a5',
    duration: 183,
    uri: 'spotify:track:7pKfPomDEeI4TPT6EOYjn9',
  },
];

export function SpotifyWidgetDemo() {
  const [currentTrack, setCurrentTrack] = useState(sampleTracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log('🎵 Play/Pause clicked');
  };

  const handleNext = () => {
    const currentIndex = sampleTracks.findIndex((track) => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % sampleTracks.length;
    setCurrentTrack(sampleTracks[nextIndex]);
    console.log('🎵 Next track clicked');
  };

  const handlePrevious = () => {
    const currentIndex = sampleTracks.findIndex((track) => track.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? sampleTracks.length - 1 : currentIndex - 1;
    setCurrentTrack(sampleTracks[prevIndex]);
    console.log('🎵 Previous track clicked');
  };

  const handleRemove = () => {
    setCurrentTrack(undefined);
    setIsPlaying(false);
    console.log('🎵 Track removed');
  };

  const handleTrackAdded = () => {
    setShowInput(false);
    // In real app, this would fetch the new track from the backend
    console.log('🎵 Track added');
  };

  return (
    <LinearGradient colors={['#F7BFF7', '#6536DA']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Spotify Widget Demo</Text>
        <Text style={styles.subtitle}>Interactive UI Preview</Text>

        {/* Spotify Widget */}
        <View style={styles.widgetContainer}>
          <Text style={styles.sectionTitle}>Current Track</Text>
          <SpotifyWidget
            track={currentTrack}
            isPlaying={isPlaying}
            canControl={true}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onPress={currentTrack ? handleRemove : undefined}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => setCurrentTrack(sampleTracks[0])}
          >
            <Text style={styles.buttonText}>Load Track 1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => setCurrentTrack(sampleTracks[1])}
          >
            <Text style={styles.buttonText}>Load Track 2</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => setCurrentTrack(sampleTracks[2])}
          >
            <Text style={styles.buttonText}>Load Track 3</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoButton} onPress={() => setShowInput(true)}>
            <Text style={styles.buttonText}>Open Search</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.status}>
          <Text style={styles.statusText}>
            Status:{' '}
            {currentTrack
              ? `${isPlaying ? 'Playing' : 'Paused'} - ${currentTrack.name}`
              : 'No track selected'}
          </Text>
        </View>
      </View>

      {/* Spotify Input Modal */}
      <SpotifyInput
        isVisible={showInput}
        onClose={() => setShowInput(false)}
        onTrackAdded={handleTrackAdded}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  widgetContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  demoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  status: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});
