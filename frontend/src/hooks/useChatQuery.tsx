import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchMessages } from '@/apis/chat';
import { Message } from '@/types/chat';

export function useInfiniteQueryChat(room_id: string): {
  prevChat: Message[];
  isFetching: boolean;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
} {
  const PAGE_SIZE = 10;
  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['chat', room_id],
    queryFn: ({ pageParam = 0 }: { pageParam?: number }) => fetchMessages({ room_id, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
  });

  const prevChat: Message[] = data?.pages.flat() ?? [];
  return { prevChat, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage };
}
