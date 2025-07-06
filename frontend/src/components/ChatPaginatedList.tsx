import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
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
        sender_avatar_url={item.sender_photo_url!}
        isVoice={false}
        isRead={item.is_read!}
        isEdited={item.is_edited!}
        media_paths={item.media_paths}
        reaction={item.reaction}
        isSent={item.is_sent!}
        createdAt={item.created_at}
        isSelected={false}
      />
    );
  };

  return (
    <FlatList
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item?.message_id ?? 'unknown'}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListFooterComponent={
        hasMore ? (
          <View style={{ padding: 16 }}>
            <ActivityIndicator size={'small'} />
          </View>
        ) : null
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
}
