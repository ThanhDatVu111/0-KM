import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import icons from '@/constants/icons';
import { Message } from '@/types/chat';
import { fetchMessages, sendMessage, deleteMessage, editMessage } from '@/apis/chat';
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

export default function Chat() {
  const socket = useSocket();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [previousChat, setPreviousChat] = useState<Message[]>([]);
  const [popoverVisible, setPopoverVisible] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [socketId, setSocketId] = useState<string | null>('');

  const onRecordPress = () => {};

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

  // Retrieve previous conversation
  const fetchConversation = useCallback(async () => {
    if (!roomId) return;
    try {
      const prevChat = await fetchMessages(roomId);
      console.log('Messages fetched successfully:', prevChat?.length || 0, 'messages');
      setPreviousChat(prevChat || []);
    } catch (err: any) {
      console.error(err);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId && socket) {
      console.log('Fetching conversation from room ID:', roomId);
      socket.emit('join-chat', roomId);
      console.log('Frontend: emitting join-chat');
      fetchConversation();
    }
  }, [socket, roomId]);

  const { messages, loading, hasMore, refreshing, loadMore, refresh } = usePagination({
    fetched: previousChat,
    pageSize: 10,
  });

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setPreviousChat((prev) => prev.filter((msg) => msg.message_id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSender = item.sender_id === userId;
    const isMessageSelected = selectedMessage?.message_id === item.message_id;

    return (
      <View className={`flex-row mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
        {/* Avatar for received messages */}
        {!isSender && (
          <Image source={icons.user_icon_female} className="w-8 h-8 rounded-full mr-2 mt-1" />
        )}

        <View className="flex-1 max-w-[80%]">
          <Popover
            isVisible={isMessageSelected}
            onRequestClose={() => setSelectedMessage(null)}
            from={
              <Pressable
                onLongPress={() => setSelectedMessage(item)}
                className={`rounded-2xl px-4 py-2.5 ${
                  isSender ? 'bg-[#F5829B] self-end' : 'bg-gray-100 self-start'
                }`}
              >
                {/* Render text content if exists */}
                {item.content ? (
                  <Text
                    className={`font-poppins-light text-base ${
                      isSender ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {item.content}
                  </Text>
                ) : null}

                {/* Render media if exists
                {item.media_paths && item.media_paths.length > 0 && (
                  <View className="mt-2">
                    {item.media_paths.map((mediaPath, index) => (
                      <Image
                        key={`${item.message_id}-media-${index}`}
                        source={{ uri: mediaPath }}
                        className="w-48 h-48 mb-2 rounded-lg"
                        resizeMode="cover"
                      />
                    ))}
                  </View> */}
                {/* )} */}
              </Pressable>
            }
          >
            <View className="bg-white p-3 rounded-md">
              <TouchableOpacity
                className="py-1"
                onPress={() => {
                  setEditedContent(item.content ?? '');
                  setIsEditing(true);
                }}
              >
                <Text>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-1"
                onPress={() => {
                  handleDelete(item.message_id);
                  setSelectedMessage(null);
                }}
              >
                <Text className="text-red-500">Delete</Text>
              </TouchableOpacity>
            </View>
          </Popover>

          <Text
            className={`font-poppins-light text-xs text-gray-500 mt-1 ${
              isSender ? 'text-right' : 'text-left'
            }`}
          >
            {new Date(item.created_at!).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Avatar for sent messages */}
        {isSender && (
          <Image source={icons.user_icon_female} className="w-8 h-8 rounded-full ml-2 mt-1" />
        )}
      </View>
    );
  };

  return (
    <ImageBackground source={images.chatBg} className="flex-1" resizeMode="cover">
      <SafeAreaView className="flex-1 p-5">
        {/* Chat Header */}
        <ChatHeader partnerName={partnerName} />

        {/* Chat Main View */}
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* <FlatList
            data={previousChat}
            renderItem={renderMessage}
            keyExtractor={(item) => item?.message_id ?? 'unknown'}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            // ListFooterComponent={hasMore ? renderFooter : null}
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
          /> */}

          <ChatPaginatedList
            previousChat={previousChat}
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
