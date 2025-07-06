import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Popover from 'react-native-popover-view';
import ChatContextMenu from './ChatContextMenu';
import ImageView from 'react-native-image-viewing';

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
  const [showContextMenu, setShowContextMenu] = useState(false);

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

  return (
    <View className={`flex-row mb-3 px-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isSender && (
        <Image source={{ uri: sender_avatar_url }} className="w-8 h-8 rounded-full mr-2 mt-1" />
      )}

      <View className="flex max-w-[80%]">
        {/* === MEDIA CONTAINER === */}
        {isMedia && (
          <View className={`flex-col ${isSender ? 'items-end' : 'items-start'}`}>
            {parsedMediaPaths.map((item, index) => (
              <Pressable
                key={index}
                className="p-1"
                onPress={() => {
                  //   setImageViewVisible(true);
                }}
              >
                <Image
                  source={{ uri: item }}
                  className="w-48 h-48 mb-2 rounded-lg"
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        )}

        {/* === CHAT CONTAINER === */}
        {!isMedia && (
          <Popover
            isVisible={showContextMenu}
            onRequestClose={() => setShowContextMenu(false)}
            from={
              <Pressable
                className={`rounded-2xl px-4 py-2.5 ${
                  isSender ? 'bg-[#F5829B] self-end' : 'bg-white self-start'
                }`}
                onLongPress={() => {
                  setShowContextMenu(true);
                }}
              >
                {content && (
                  <Text
                    className={`font-poppins-medium text-base ${
                      isSender ? 'text-white' : 'text-[#F5829B]'
                    }`}
                  >
                    {content}
                  </Text>
                )}
              </Pressable>
            }
          >
            <ChatContextMenu />
          </Popover>
        )}

        {/* === TIMESTAMP === */}
        <Text
          className={`font-poppins-light text-xs mt-1 ${
            isSender ? 'text-right text-white' : 'text-left text-[#F5829B]'
          }`}
        >
          {formattedTimestamp} {isEdited && '(edited)'}
        </Text>
      </View>

      {/* Sender Avatar on the Right */}
      {isSender && (
        <Image source={{ uri: sender_avatar_url }} className="w-8 h-8 rounded-full ml-2 mt-1" />
      )}
    </View>
  );
}
