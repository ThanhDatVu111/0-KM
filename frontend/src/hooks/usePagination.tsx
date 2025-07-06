import { fetchMessages } from '@/apis/chat';
import { Message } from '@/types/chat';
import { useEffect, useState } from 'react';

interface UsePaginationProps {
  room_id: string;
  pageSize?: number;
}

export const usePagination = ({ room_id, pageSize = 10 }: UsePaginationProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pageNo, setPageNo] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = async (page: number, replace = false) => {
    try {
      setLoading(true);
      const pageData = await fetchMessages({ room_id, pageParam: page });

      if (replace) {
        setMessages(pageData.reverse()); // Oldest at top
        setPageNo(page); // reset page number
      } else {
        setMessages((prev) => [...pageData.reverse(), ...prev]);
        setPageNo(page); // update to new page number
      }

      setHasMore(pageData.length === pageSize);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadMessages(pageNo + 1);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    setMessages([]);
    setPageNo(0);
    setHasMore(true);
    await loadMessages(0, true);
    setRefreshing(false);
  };

  useEffect(() => {
    if (room_id) {
      loadMessages(0, true); // initial load
    }
  }, [room_id]);

  return {
    messages,
    loading,
    hasMore,
    refreshing,
    loadMore,
    refresh,
  };
};
