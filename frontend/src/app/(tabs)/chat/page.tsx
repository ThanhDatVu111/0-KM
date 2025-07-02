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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import icons from '@/constants/icons';
import { Message } from '@/types/chat';
import { fetchMessages, sendMessage, deleteMessage, editMessage } from '@/apis/chat';
import { fetchRoom } from '@/apis/room';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMessageActions } from '@/hooks/useMessageAction';
import * as ImagePicker from 'expo-image-picker';
import Popover from 'react-native-popover-view';
import images from '@/constants/images';
import ChatHeader from '@/components/ChatHeader';
import { fetchUser } from '@/apis/user';
import { BASE_URL } from '@/apis/apiClient';
import io from 'socket.io-client';

export default function Chat() {
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
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socketRef = useRef<SocketIOClient.Socket | null>(null);

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

  // Create socket connection with authentication
  socketRef.current = io(BASE_URL, {
    transports: ['websocket', 'polling'],
    auth: {
      userId: userId,
    },
    query: {
      userId: userId,
    },
  });
  const socket = socketRef.current;

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Connected to socket server:', socket.id);
    setIsConnected(true);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from socket:', reason);
    setIsConnected(false);
  });

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
    if (roomId) {
      console.log('Room ID changed, fetching conversation:', roomId);
      fetchConversation();
    }
  }, [roomId]);

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImages.length) return;
    if (!roomId) return;

    try {
      const messagePayload = {
        message_id: `${Date.now()}-${userId}`,
        room_id: roomId,
        sender_id: userId!,
        content: message.trim(),
        media_paths: selectedImages.length > 0 ? selectedImages : undefined,
        created_at: new Date().toISOString(),
        is_sent: true,
      };

      await sendMessage(messagePayload);
      setMessage('');
      socket.emit('send-message', messagePayload);
      setSelectedImages([]);
      setPreviousChat((prev) => [...prev, messagePayload]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setPreviousChat((prev) => prev.filter((msg) => msg.message_id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const onImagePress = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets?.length) {
        // Upload images to Cloudinary first
        const uploadPromises = result.assets.map(async (asset) => {
          try {
            const formData = new FormData();
            formData.append('file', {
              uri: asset.uri,
              type: 'image/jpeg',
              name: 'image.jpg',
            } as any);

            // Get Cloudinary signature
            const response = await fetch(`${BASE_URL}/cloudinary-sign`);
            const { signature, timestamp } = await response.json();

            formData.append('api_key', process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY!);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);

            const uploadResponse = await fetch(
              `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
              {
                method: 'POST',
                body: formData,
              },
            );

            const uploadResult = await uploadResponse.json();
            return uploadResult.secure_url;
          } catch (error) {
            console.error('Error uploading image:', error);
            return null;
          }
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        const validUrls = uploadedUrls.filter((url) => url !== null);

        if (validUrls.length > 0) {
          setSelectedImages(validUrls);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
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
          <FlatList
            data={previousChat}
            renderItem={renderMessage}
            keyExtractor={(item) => item?.message_id ?? 'unknown'}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          />

          {/* Chat Input */}
          <View className="bg-linear-to-r/increasing from-[#FFC6F9]-100 to-[#6536DA]-100 border-t border-gray-200 px-3 py-2 flex-row items-center overflow-scroll container mx-auto">
            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <View className="absolute bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-2">
                <View className="flex-row flex-wrap gap-2">
                  {selectedImages.map((imageUri, index) => (
                    <View key={index} className="relative">
                      <Image
                        source={{ uri: imageUri }}
                        className="w-16 h-16 rounded-lg"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setSelectedImages((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 justify-center items-center"
                      >
                        <Text className="text-white text-xs">×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

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
    </ImageBackground>
  );
}
