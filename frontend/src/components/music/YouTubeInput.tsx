import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { extractVideoId, isValidVideoId } from '@/utils/youtubeUtils';

type Props = {
  onVideoIdSubmit: (videoId: string) => void;
  onCancel: () => void;
};

export function YouTubeInput({ onVideoIdSubmit, onCancel }: Props) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL');
      return;
    }

    setIsLoading(true);

    try {
      const videoId = extractVideoId(url.trim());

      if (!videoId || !isValidVideoId(videoId)) {
        Alert.alert('Error', 'Invalid YouTube URL. Please check the link and try again.');
        return;
      }

      onVideoIdSubmit(videoId);
    } catch (error) {
      Alert.alert('Error', 'Failed to process YouTube URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 rounded-2xl">
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

      <View className="relative z-10">
        <Text className="text-white font-pmedium text-lg mb-4 text-center">
          Add YouTube Music Video
        </Text>

        <View className="mb-6">
          <Text className="text-white/80 font-pregular text-sm mb-2">YouTube URL</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            className="bg-white/20 text-white p-3 rounded-lg border border-white/30"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 bg-white/20 p-3 rounded-lg border border-white/30"
          >
            <Text className="text-white font-pmedium text-center">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-white p-3 rounded-lg"
          >
            <Text className="text-purple-600 font-pmedium text-center">
              {isLoading ? 'Adding...' : 'Add Video'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-white/60 font-plight text-xs text-center mt-3">
          Paste any YouTube URL and we'll extract the video for you
        </Text>
      </View>
    </View>
  );
}
