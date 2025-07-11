import React, { useEffect, useState } from 'react';
import { Platform, KeyboardAvoidingView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import images from '@/constants/images';
import ChatHeader from '@/components/ChatHeader';
import { fetchUser } from '@/apis/user';
import ChatInput from '@/components/ChatInput';
import { useSocket } from '@/utils/SocketProvider';
import ChatPaginatedList from '@/components/ChatPaginatedList';
import { useChatSocket } from '@/hooks/useSocketChat';
import { useInfiniteQueryChat } from '@/hooks/useChatQuery';
import {
  CaptureProtection,
  useCaptureProtection,
  CaptureEventType,
} from 'react-native-capture-protection';
import AudioRecorder from '@/components/AudioRecorder';

export default function Chat() {
  const socket = useSocket();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerId, setPartnerId] = useState<string>('');
  const [partnerAvatar, setPartnerAvatar] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    // Fetch room ID
    const loadRoom = async () => {
      try {
        const room = await fetchRoom({ user_id: userId });
        setRoomId(room.room_id);
        const partner_id = room.user_1 === userId ? room.user_2 : room.user_1;
        setPartnerId(partner_id);
        // Fetch partner data
        const partner = await fetchUser(partner_id);
        if (partner) {
          setPartnerName(partner.username || 'Your Partner');
          setPartnerAvatar(partner.photo_url || '');
        }

        // Fetch current user data
        const currentUser = await fetchUser(userId);
        if (currentUser) {
          setUserAvatar(currentUser.photo_url || '');
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
      // socket.emit('user-online', { room_id: roomId, user_id: userId });
      console.log('Frontend: emitting join-chat');
      CaptureProtection.prevent();

      const handleOnline = ({ userId }: { userId: string }) => {
        if (userId === partnerId) {
          setPartnerOnline(true);
        }
      };

      const handleOffline = ({ userId }: { userId: string }) => {
        if (userId === partnerId) {
          setPartnerOnline(false);
        }
      };

      socket.on('partner-online', handleOnline);
      socket.on('partner-offline', handleOffline);

      return () => {
        socket.off('partner-online', handleOnline);
        socket.off('partner-offline', handleOffline);
      };
    }
  }, [socket, roomId, userId, partnerId]);

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
    <ImageBackground source={images.libraryBg} className="flex-1" resizeMode="cover">
      <SafeAreaView className="flex-1 p-5">
        <ChatHeader isOnline={partnerOnline} partnerName={partnerName} avatar_url={partnerAvatar} />
        {/* Chat Header */}

        {/* Chat Main View */}
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ChatPaginatedList
            room_id={roomId!}
            messages={combinedMessages}
            refreshing={isFetchingNextPage}
            refresh={isFetching}
            loadMore={fetchNextPage}
            hasMore={hasNextPage!}
            userAvatar={userAvatar}
            partnerAvatar={partnerAvatar}
            userId={userId!}
            onEditMessage={(messageId: string, text: string) => {
              setEditingMessageId(messageId);
              setEditingText(text);
            }}
          />

          {/* Chat Input */}
          <ChatInput
            room_id={roomId}
            sender_id={userId!}
            editingMessageId={editingMessageId}
            editingText={editingText}
            onCancelEdit={() => {
              setEditingMessageId(null);
              setEditingText('');
            }}
            onSaveEdit={(messageId: string, newText: string) => {
              socket?.emit('edit-message', { messageId, newText });
              setEditingText('');
              setEditingMessageId(null);
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
