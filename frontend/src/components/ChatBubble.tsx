import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Popover from 'react-native-popover-view';
import ChatContextMenu from './ChatContextMenu';

interface ChatBubbleProps {
  message_id: string;
  content?: string;
  isSender: boolean;
  sender_avatar_url: string;
  isVoice: boolean;
  isRead: boolean;
  isEdited: boolean;
  media_paths?: string[];
  reaction?: string;
  isSent: boolean;
  createdAt: string;
  isSelected: boolean;
}

export default function ChatBubble({
  message_id,
  content,
  isSender,
  sender_avatar_url,
  isVoice,
  isRead,
  isEdited,
  media_paths,
  reaction,
  isSent,
  createdAt,
  isSelected,
}: ChatBubbleProps) {
  // Format the timestamp
  const formattedTimestamp = new Date(createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const parsedMediaPaths = (() => {
    try {
      return typeof media_paths === 'string' ? JSON.parse(media_paths) : media_paths;
    } catch {
      return [];
    }
  })();

  const isMedia = Array.isArray(parsedMediaPaths) && parsedMediaPaths.length > 0;

  // Format the content
  return (
    <View className={`flex-row mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for received messages */}
      {!isSender && (
        <Image source={{ uri: sender_avatar_url }} className="w-8 h-8 rounded-full mr-2 mt-1" />
      )}

      <View className="flex-1 max-w-[80%]">
        <Popover
          isVisible={isSelected}
          from={
            <Pressable
              className={`rounded-2xl px-4 py-2.5 ${
                isSender ? 'bg-[#F5829B] self-end' : 'bg-white self-start'
              }`}
              onPress={() => <ChatContextMenu />}
            >
              {/* Render text content if exists */}
              {content && (
                <Text
                  className={`font-poppins-medium text-base ${
                    isSender ? 'text-white' : 'text-[#F5829B]'
                  }`}
                >
                  {content}
                </Text>
              )}

              {/* Render media if exists */}
              {isMedia && (
                <View className="mt-2">
                  {parsedMediaPaths.map((item, index) => (
                    <Image
                      key={index}
                      source={{ uri: item }}
                      className="w-48 h-48 mb-2 rounded-lg"
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
            </Pressable>
          }
        ></Popover>

        {/* Time stamp */}
        <Text
          className={`font-poppins-light text-xs text-white mt-1 ${
            isSender ? 'text-right' : 'text-left'
          }`}
        >
          {formattedTimestamp}
          {isEdited && 'Edited'}
        </Text>
      </View>

      {/* Avatar for sent messages */}
      {isSender && (
        <Image source={{ uri: sender_avatar_url }} className="w-8 h-8 rounded-full ml-2 mt-1" />
      )}
    </View>
  );
}
