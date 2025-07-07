import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StatusBar,
  Platform,
  FlatList,
  KeyboardAvoidingView,
  TextInput,
  Pressable,
  ImageBackground,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import * as ImagePicker from 'expo-image-picker';
import Popover from 'react-native-popover-view';
import images from '@/constants/images';
import ChatHeader from '@/components/ChatHeader';
import { fetchUser } from '@/apis/user';
import { BASE_URL } from '@/apis/apiClient';
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { usePagination } from '@/hooks/usePagination';
import ChatInput from '@/components/ChatInptut';
import { useSocket } from 'utils/SocketProvider';
import ChatPaginatedList from '@/components/ChatPaginatedList';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useChatSocket } from '@/hooks/useSocketChat';

export default function Chat() {
  const socket = useSocket();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>('');
  const nav = useNavigation();
  const {
    messages: previousChat,
    hasMore,
    refreshing,
    loadMore,
    refresh,
    reset,
  } = usePagination({
    room_id: roomId!,
  });

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
      // fetchConversation();

      // Join chat
      socket.emit('join-chat', roomId);
      console.log('Frontend: emitting join-chat');
    }
  }, [socket, roomId, nav, reset]);

  const { messages: socketMessage } = useChatSocket({ room_id: roomId!, user_id: userId! });

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
            messages={socketMessage}
            refreshing={refreshing}
            refresh={refresh}
            loadMore={loadMore}
            hasMore={hasMore}
          />

          {/* Chat Input */}
          <ChatInput room_id={roomId} sender_id={userId!} message_id={`${userId}-${Date.now()}`} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
