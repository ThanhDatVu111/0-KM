import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  videoId: string;
  onPress?: () => void;
  className?: string;
};

export function YouTubeWidget({ videoId, onPress, className = '' }: Props) {
  // Debug logging
  console.log('🎬 YouTubeWidget Debug:', { videoId, className });

  if (!videoId) {
    console.log('🎬 YouTubeWidget: No videoId provided, showing empty state');
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

  console.log('🎬 YouTubeWidget: Rendering video with ID:', videoId);

  // Validate video ID format (YouTube video IDs are typically 11 characters)
  if (videoId.length !== 11) {
    console.log('🎬 YouTubeWidget: Invalid video ID length:', videoId.length);
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
          <Ionicons name="alert-circle" size={32} color="white" />
          <Text className="text-white font-pmedium text-lg mt-2">Invalid Video</Text>
          <Text className="text-white/70 font-pregular text-sm text-center mt-2">
            The video ID format is invalid
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
      <View style={styles.videoContainer}>
        <YoutubePlayer
          height={styles.videoContainer.height}
          play={false}
          videoId={videoId}
          webViewProps={{
            style: styles.webView,
            androidLayerType: 'hardware',
          }}
          initialPlayerParams={{
            preventFullScreen: true,
            cc_lang_pref: 'us',
            showClosedCaptions: false,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
          }}
          onError={(error: any) => {
            console.error('🎬 YouTube player error:', error);
          }}
          onReady={() => {
            console.log('🎬 YouTube player ready for video:', videoId);
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    height: 220,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webView: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    overflow: 'hidden',
  },
});
