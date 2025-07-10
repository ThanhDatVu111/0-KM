import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  videoId: string;
  onPress?: () => void;
  className?: string;
};

function RetroHeader({ title }: { title: string }) {
  return (
    <View className="bg-[#6536DD] border-b-2 border-black px-4 py-3 items-center rounded-t-md">
      <View className="relative">
        {[
          [-2, 0],
          [2, 0],
          [0, -2],
          [0, 2],
        ].map(([dx, dy], index) => (
          <Text
            key={index}
            style={{
              position: 'absolute',
              fontFamily: 'PressStart2P',
              fontSize: 12,
              color: 'white',
              left: dx,
              top: dy,
            }}
          >
            {title}
          </Text>
        ))}

        <Text
          style={{
            fontFamily: 'PressStart2P',
            fontSize: 12,
            color: '#F24187',
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

export function YouTubeWidget({ videoId, onPress, className = '' }: Props) {
  if (!videoId) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="YOUTUBE" />
        <View className="bg-white px-4 py-6 rounded-b-md flex-1 justify-center">
          <View className="items-center justify-center">
            <Ionicons name="play-circle" size={32} color="#6536DD" />
            <Text className="font-pmedium text-lg text-black mt-2">No Music Video</Text>
            <Text className="text-gray-600 font-pregular text-sm text-center mt-2">
              Add a YouTube video to share with your partner
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Validate video ID format (YouTube video IDs are typically 11 characters)
  if (videoId.length !== 11) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="YOUTUBE" />
        <View className="bg-white px-4 py-6 rounded-b-md flex-1 justify-center">
          <View className="items-center justify-center">
            <Ionicons name="alert-circle" size={32} color="#6536DD" />
            <Text className="font-pmedium text-lg text-black mt-2">Invalid Video</Text>
            <Text className="text-gray-600 font-pregular text-sm text-center mt-2">
              The video ID format is invalid
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      className={`w-full h-full shadow-2xl border-2 border-black rounded-lg overflow-hidden ${className}`}
    >
      <RetroHeader title="YOUTUBE" />
      <View className="bg-white rounded-b-md flex-1">
        <View style={styles.container}>
          <YoutubePlayer
            height={220}
            play={false}
            videoId={videoId}
            webViewProps={{
              style: { borderRadius: 8, overflow: 'hidden' },
            }}
            onError={(error: any) => {
              console.error('YouTube player error:', error);
            }}
            onReady={() => {
              // Player is ready
            }}
          />

          {/* Remove button overlay positioned at bottom right - only show if onPress is provided */}
          {onPress && (
            <TouchableOpacity
              onPress={onPress}
              style={[
                styles.removeButton,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  elevation: 4,
                },
              ]}
              className="bg-red-500 border-2 border-black"
            >
              <View className="bg-red-500 p-2">
                <Ionicons name="close" size={16} color="white" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
});
