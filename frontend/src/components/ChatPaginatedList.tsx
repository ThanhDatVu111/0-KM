import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import ChatBubble from './ChatBubble';
import { Message } from '@/types/chat';
import { useAuth } from '@clerk/clerk-expo';

interface ChatPaginatedListProps {
  previousChat: Message[];
  refreshing: boolean;
  refresh: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export default function ChatPaginatedList({
  previousChat,
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
      data={previousChat}
      renderItem={renderMessage}
      keyExtractor={(item) => item?.message_id ?? 'unknown'}
      inverted
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListFooterComponent={hasMore ? <View style={{ padding: 16 }} /> : null}
      onEndReached={loadMore}
      onEndReachedThreshold={0.1}
    />
  );
}
