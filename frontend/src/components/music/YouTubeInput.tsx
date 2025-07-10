import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { extractVideoId, isValidVideoId } from '@/utils/youtubeUtils';

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
    <View className="w-full max-w-md shadow-2xl border-2 border-black rounded-lg">
      <RetroHeader title="YOUTUBE" />
      <View className="bg-[#FDA3D4] px-6 py-6 rounded-b-md">
        <View className="mb-4">
          <Text className="text-black font-pmedium text-sm mb-2">YouTube URL</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor="rgba(0,0,0,0.5)"
            className="bg-white text-black p-3 rounded-lg border-2 border-black"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            }}
          />
        </View>

        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 bg-gray-400 border-2 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            }}
          >
            <View className="bg-gray-400 p-3">
              <Text className="text-white font-pmedium text-sm text-center">CANCEL</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-[#6536DD] border-2 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <View className="bg-[#6536DD] p-3">
              <Text className="text-white font-pmedium text-sm text-center">
                {isLoading ? 'ADDING...' : 'ADD VIDEO'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text className="text-black/70 font-plight text-xs text-center">
          Paste any YouTube URL and we'll extract the video for you
        </Text>
      </View>
    </View>
  );
}
