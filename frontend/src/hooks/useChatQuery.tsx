// import { useInfiniteQuery } from '@tanstack/react-query';
// import { useSocket } from 'utils/SocketProvider';
// import qs from 'query-string';

// interface ChatQueryProps {
//   queryKey: string;
//   apiUrl: string;
//   paramKey: string; // room ID
//   paramValue: string; // page number
// }

// export const useChatQuery = ({ queryKey, apiUrl, paramKey, paramValue }: ChatQueryProps) => {
//   const socket = useSocket();
//   const isConnected = socket?.connected;

//   const fetchPage = async ({ pageParam }: { pageParam?: string | null }) => {
//     const url = qs.stringifyUrl(
//       {
//         url: `${apiUrl}`,
//         query: {
//           cursor: pageParam,
//           [paramKey]: paramValue,
//         },
//       },
//       { skipNull: true },
//     );

//     const res = await fetch(url, {
//       method: 'GET',
//       headers: { 'Content-Type': 'application/json' },
//     });

//     if (!res.ok) throw new Error('Failed to fetch messages');
//     return res.json();
//   };

//   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
//     queryKey: [queryKey],
//     queryFn: fetchPage,
//     initialPageParam: null,
//     getNextPageParam: (lastPage) => lastPage?.nextCursor,
//     refetchInterval: isConnected ? false : 1000,
//   });

//   return {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//     status,
//   };
// };
