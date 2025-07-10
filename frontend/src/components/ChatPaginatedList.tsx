import React from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import ChatBubble from './ChatBubble';
import { Message } from '@/types/chat';

interface ChatPaginatedListProps {
  room_id: string;
  messages: Message[];
  refreshing: boolean;
  refresh: boolean;
  loadMore: () => void;
  hasMore: boolean;
  userAvatar?: string;
  partnerAvatar?: string;
  userId: string;
}

export default function ChatPaginatedList({
  room_id,
  messages,
  refreshing,
  refresh,
  loadMore,
  hasMore,
  userAvatar,
  partnerAvatar,
  userId,
  
}: ChatPaginatedListProps) {
  const renderMessage = ({ item }: { item: Message }) => {
    const isSender = item.sender_id === userId;
    // Use the appropriate avatar based on who sent the message
    const avatarUrl = isSender ? userAvatar : partnerAvatar;

    return (
      <ChatBubble
        room_id={room_id}
        user_id={userId}
        message_id={item.message_id}
        content={item.content ?? ''}
        isSender={isSender}
        sender_avatar_url={avatarUrl || item.sender_photo_url || ''}
        isVoice={false}
        isRead={item.is_read ?? false}
        isEdited={item.is_edited ?? false}
        media_paths={item.media_paths}
        reaction={item.reaction}
        isSent={item.is_sent ?? true}
        createdAt={item.created_at}
        isSelected={false}
      />
    );
  };

  return (
    <FlatList
      data={messages}
      renderItem={renderMessage}
      inverted
      keyExtractor={(item) => item.message_id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 8 }}
      onEndReached={() => {
        if (hasMore && !refreshing) loadMore();
      }}
      onEndReachedThreshold={0.1} // fire loadMore when near bottom (which is top visually)
      scrollEventThrottle={100}
      ListFooterComponent={
        refresh || hasMore ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
    />
  );
}
