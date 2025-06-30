import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  videoId: string;
  title?: string;
  onPress?: () => void;
  className?: string;
};

export function YouTubeWidget({ videoId, title, onPress, className = '' }: Props) {
  if (!videoId) {
    return (
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 rounded-2xl ${className}`}
      >
        <LinearGradient
          colors={['#6536DA', '#F7BFF7']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            zIndex: -1,
          }}
        />
        <View className="items-center justify-center py-6">
          <Ionicons name="play-circle" size={32} color="white" />
          <Text className="text-white font-pmedium text-lg mt-2">No Music Video</Text>
          <Text className="text-white/70 font-pregular text-sm text-center mt-2">
            Add a YouTube video to share with your partner
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`border border-black bg-white/10 shadow-md backdrop-blur-lg overflow-hidden rounded-2xl ${className}`}
      style={{ borderWidth: 1.5 }}
    >
      <LinearGradient
        colors={['#6536DA', '#F7BFF7']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          zIndex: -1,
        }}
      />
      {title && (
        <View className="p-3">
          <Text className="text-white font-pmedium text-base" numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
      <View style={styles.container}>
        <YoutubePlayer
          height={200}
          play={false}
          videoId={videoId}
          webViewProps={{
            style: { borderRadius: 12, overflow: 'hidden' },
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
});
