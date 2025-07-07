import React, { useEffect, useState } from 'react';
import { Platform, KeyboardAvoidingView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import images from '@/constants/images';
import ChatHeader from '@/components/ChatHeader';
import { fetchUser } from '@/apis/user';
import ChatInput from '@/components/ChatInptut';
import { useSocket } from 'utils/SocketProvider';
import ChatPaginatedList from '@/components/ChatPaginatedList';
import { useChatSocket } from '@/hooks/useSocketChat';
import { useInfiniteQueryChat } from '@/hooks/useChatQuery';

export default function Chat() {
  const socket = useSocket();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>('');

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    // Fetch room ID
    const loadRoom = async () => {
      try {
        const room = await fetchRoom({ user_id: userId });
        setRoomId(room.room_id);
        const partner_id = room.user_2;
        const partner = await fetchUser(partner_id);
        if (partner) {
          setPartnerName(partner.username || 'Your Partner');
          //   setPartnerAvatar(partnerAvatar || icons.user_icon_female);
        }
      } catch (err: any) {
        console.error('Error fetching room or partner:', err);
      }
    };

    loadRoom();
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (roomId && socket) {
      // Fetching conversation
      console.log('Fetching conversation from room ID:', roomId);

      // Join chat
      socket.emit('join-chat', roomId);
      console.log('Frontend: emitting join-chat');
    }
  }, [socket, roomId]);

  const { messages: socketMessage } = useChatSocket({ room_id: roomId!, user_id: userId! });
  const { prevChat, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQueryChat(roomId!);

  const combinedMessages = React.useMemo(() => {
    if (!prevChat || !socketMessage) return prevChat || [];

    // Assuming messages have unique ids, merge and remove duplicates:
    const map = new Map();

    // Add socket messages (new messages or edits) first, since it is an inverted list
    socketMessage.forEach((msg) => map.set(msg.message_id, msg));

    // Add all prevChat messages after
    prevChat.forEach((msg) => map.set(msg.message_id, msg));

    // Convert back to array, descending order
    return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [prevChat, socketMessage]);

  return (
    <ImageBackground source={images.chatBg} className="flex-1" resizeMode="cover">
      <SafeAreaView className="flex-1 p-5">
        {/* Chat Header */}
        <ChatHeader room_id={roomId!} partnerName={partnerName} />

        {/* Chat Main View */}
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ChatPaginatedList
            messages={combinedMessages}
            refreshing={isFetchingNextPage}
            refresh={isFetching}
            loadMore={fetchNextPage}
            hasMore={hasNextPage!}
          />

          {/* Chat Input */}
          <ChatInput room_id={roomId} sender_id={userId!} message_id={`${userId}-${Date.now()}`} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
