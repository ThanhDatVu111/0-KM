import { fetchMessages } from '@/apis/chat';
import { Message } from '@/types/chat';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

interface usePaginationProps {
  fetched: Message[];
  pageSize: number;
}

export const usePagination = ({ fetched, pageSize = 10 }: usePaginationProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = async (page = 1, replace = false) => {
    try {
      setLoading(true);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageData = fetched.slice(start, end);
      setMessages((prev) => (replace || page === 1 ? pageData : [...prev, ...pageData]));

      setHasMore(end < fetched.length);
      setPageNo(page);
    } catch (error) {
      console.error('Failed to paginate:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(1, true); // First page renders
  }, [fetched]);

  const loadMore = () => {
    if (hasMore && !loading) {
      loadMessages(pageNo + 1);
    }
  };

  const refresh = () => {
    setRefreshing(true);
    setHasMore(true);
    loadMessages(1, true);
    setRefreshing(false);
  };

  // const renderFooter = () => {
  //   if (!hasMore || fetched.length < pageSize) return null;
  //   return <ActivityIndicator animating size="large/>
  // }

  return {
    messages,
    pageNo,
    hasMore,
    loading,
    refreshing,
    loadMore,
    refresh,
  };
};
