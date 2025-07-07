import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
} from 'react-native';
import ChatBubble from './ChatBubble';
import { Message } from '@/types/chat';
import { useAuth } from '@clerk/clerk-expo';

interface ChatPaginatedListProps {
  messages: Message[];
  refreshing: boolean;
  refresh: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export default function ChatPaginatedList({
  messages,
  refreshing,
  refresh,
  loadMore,
  hasMore,
}: ChatPaginatedListProps) {
  const { userId } = useAuth();

  const renderMessage = ({ item }: { item: Message }) => {
    const isSender = item.sender_id === userId;

    return (
      <ChatBubble
        message_id={item.message_id}
        content={item.content ?? ''}
        isSender={isSender}
        sender_avatar_url={item.sender_photo_url ?? ''}
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
        hasMore ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
    />
  );
}
