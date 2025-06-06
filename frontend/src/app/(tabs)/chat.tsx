import React, { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import icons from '@/constants/icons';
import { Message } from '@/types/chat';
import { chatApi } from '@/apis/chat';
import { fetchRoom } from '@/apis/room';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMessageActions } from '@/hooks/useMessageAction';
import * as ImagePicker from 'expo-image-picker';
import Popover from 'react-native-popover-view';

export default function ChatScreen() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [roomId, setRoomId] = useState<string>('');
  const [partnerId, setPartnerId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [previousChat, setPreviousChat] = useState<Message[]>([]);
  const [popoverVisible, setPopoverVisible] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const onRecordPress = () => {};

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    const setupChatRoom = async () => {
      try {
        const room = await fetchRoom({ user_id: userId });

        if (room?.room_id) {
          setRoomId(room.room_id);
          setPartnerId(room.user_2);
          console.log(
            `Initializing chat with room_id ${room.room_id} and partnerId ${room.user_2}`,
          );
          return;
        }

        setRoomId(room.room_id);
        setPartnerId(room.user_2);
      } catch (err: any) {
        console.error(err);
      }
    };

    setupChatRoom();
  }, [isLoaded, isSignedIn, userId]);

  // Retrieve previous conversation
  const fetchConversation = useCallback(async () => {
    if (!roomId) return;
    try {
      const prevChat = await chatApi.fetchMessages(roomId);
      console.log('Messages fetched successfully:', prevChat?.length || 0, 'messages');
      setPreviousChat(prevChat || []);
    } catch (err: any) {
      console.error(err);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId) {
      console.log('Room ID changed, fetching conversation:', roomId);
      fetchConversation();
    }
  }, [roomId]);

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const messagePayload = {
      message_id: `${Date.now()}-${userId}`,
      room_id: roomId,
      content: trimmed,
      sender_id: userId!,
      created_at: new Date().toISOString(),
      is_sent: true,
    };

    setPreviousChat((prev) => [messagePayload, ...prev]);
    setMessage('');

    try {
      console.log('Sending message:', messagePayload);
      await chatApi.sendMessage(messagePayload);
      setMessage('');
    } catch (error: any) {
      console.error('Failed to send message: ', error);
      // Remove the optimistic message on error
      setPreviousChat((prev) => prev.filter((msg) => msg.message_id !== messagePayload.message_id));

      // Restore the message text so user can retry
      setMessage(trimmed);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      setPreviousChat((prev) => prev.filter((msg) => msg.message_id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const onImagePress = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // ✅ correct singular value
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        const photo = result.assets[0];
        const photo_object = {
          uri: photo.uri,
          type: photo.type as string,
        };
        if (photo_object) {
          const messagePayload = {
            message_id: `${Date.now()}-${userId}`,
            room_id: roomId,
            sender_id: userId!,
            content: '',
            media: photo_object,
            created_at: new Date().toISOString(),
            is_sent: true,
          };
          await chatApi.sendMessage(messagePayload);
          setMessage('');
          setPreviousChat((prev) => [...prev, messagePayload]);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
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

                {/* Render media if exists */}
                {item.media && (
                  <Image
                    source={{ uri: item.media.uri }}
                    className="w-48 h-48 mt-2 rounded-lg"
                    resizeMode="cover"
                  />
                )}
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
    <SafeAreaView className="flex-1 bg-white p-5">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Chat Header */}
      <View
        className="flex-row items-center bg-white px-4 py-3 rounded-full"
        style={{
          ...Platform.select({
            ios: {
              shadowColor: '#F5829B',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            },
            android: {
              elevation: 2,
            },
          }),
        }}
      >
        <TouchableOpacity className="mr-3" onPress={() => router.push('/(tabs)/home')}>
          <Text className="text-lg text-[#F5829B]">←</Text>
        </TouchableOpacity>

        <Image source={icons.user_icon_female} className="w-10 h-10 rounded-lg mr-3" />

        <View className="flex-1">
          <Text className="text-lg font-poppins-medium text-black">Your Partner</Text>
          <Text className="text-sm text-gray-500 gap-2">Active now</Text>
        </View>

        <TouchableOpacity className="p-2">
          <Image source={icons.phone} className="w-6 h-6" />
        </TouchableOpacity>

        <TouchableOpacity className="p-2 ml-2">
          <Image source={icons.video} className="w-6 h-6" />
        </TouchableOpacity>
      </View>
      {/* Chat Main View */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={previousChat}
          renderItem={renderMessage}
          keyExtractor={(item) => item?.message_id ?? 'unknown'}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        />

        {/* Chat Input */}
        <View className="bg-white border-t border-gray-200 px-3 py-2 flex-row items-center overflow-scroll container mx-auto">
          <View className="flex-1 flex-row bg-white border border-accent px-4 py-2 mr-2 rounded-lg">
            {/* Image Button */}
            <TouchableOpacity onPress={onImagePress} className="mt-0.5">
              <FontAwesome name="camera" size={24} color="#F5829B" />
            </TouchableOpacity>
            {/* Text Input : Messages */}
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              multiline
              className=" text-base p-1 items-center px-4 font-poppins-light mr-5"
              style={{ maxHeight: 100 }}
              placeholderTextColor="#F5829B"
            />
            {/* Voice Button */}
            {!message && (
              <TouchableOpacity onPress={onRecordPress} className="mt-2.5 absolute right-4">
                <MaterialIcons name="keyboard-voice" size={24} color="#F5829B" />
              </TouchableOpacity>
            )}
          </View>
          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSendMessage}
            className="w-12 h-12 rounded-full bg-accent justify-center items-center"
          >
            <Ionicons name="send" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
