import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Popover from 'react-native-popover-view';
import { AntDesign, Feather, Ionicons, Octicons } from '@expo/vector-icons';
import { useChatSocket } from '@/hooks/useSocketChat';

interface ChatBubbleProps {
  room_id: string;
  user_id: string;
  message_id: string;
  content?: string;
  isSender: boolean;
  sender_avatar_url: string;
  isVoice: boolean;
  isRead: boolean;
  isEdited: boolean;
  media_paths?: string[];
  reaction?: string;
  isSent: boolean;
  createdAt: string;
  isSelected: boolean;
}

const Divider = () => <View className="h-[0.75px] my-1 bg-[#F24187]" />;

const MenuItem = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} className="flex-row items-center justify-between px-3 py-2">
    <Text className="text-base text-[#F24187]">{label}</Text>
    {icon}
  </Pressable>
);

export default function ChatBubble({
  room_id,
  user_id,
  message_id,
  content,
  isSender,
  sender_avatar_url,
  isVoice,
  isRead,
  isEdited,
  media_paths,
  reaction,
  isSent,
  createdAt,
  isSelected,
}: ChatBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const bubbleRef = useRef<View>(null);

  const { handleEditMessage, handleDeleteMessage } = useChatSocket({ room_id, user_id });

  const formattedTimestamp = new Date(createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const parsedMediaPaths = (() => {
    try {
      return typeof media_paths === 'string' ? JSON.parse(media_paths) : media_paths;
    } catch {
      return [];
    }
  })();

  return (
    <View className={`flex-row mb-3 px-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
      {!isSender && (
        <Image source={{ uri: sender_avatar_url }} className="w-8 h-8 rounded-full mr-2 mt-1" />
      )}

      <View className="flex max-w-[80%] relative">
        <Popover
          isVisible={showMenu}
          onRequestClose={() => setShowMenu(false)}
          from={
            <Pressable
              ref={bubbleRef}
              onLongPress={() => setShowMenu(true)}
              className={`rounded-2xl px-4 py-2.5 ${isSender ? 'bg-[#F5829B]' : 'bg-white'}`}
            >
              <Text
                className={`font-poppins-medium text-base ${
                  isSender ? 'text-white' : 'text-[#F5829B]'
                }`}
              >
                {content}
              </Text>
            </Pressable>
          }
          placement="bottom"
          arrowStyle={{ backgroundColor: '#fff' }}
          backgroundStyle={{ backgroundColor: 'transparent' }}
        >
          <View className="bg-white rounded-xl w-48 py-2 shadow-lg">
            <MenuItem
              label="Reply"
              icon={<Octicons name="reply" size={24} color="#F24187" />}
              onPress={() => {
                setShowMenu(false);
                console.log('User replying');
              }}
            />
            <Divider />
            <MenuItem
              label="Copy"
              icon={<Feather name="copy" size={24} color="#F24187" />}
              onPress={() => {
                setShowMenu(false);
                console.log('User copied text');
              }}
            />
            <Divider />
            <MenuItem
              label="Edit"
              icon={<Feather name="edit-2" size={24} color="#F24187" />}
              onPress={() => {
                setShowMenu(false);
                handleEditMessage(message_id, content ?? '');
              }}
            />
            <Divider />
            <MenuItem
              label="Unsend"
              icon={<Ionicons name="arrow-undo-circle-outline" size={24} color="#F24187" />}
              onPress={() => {
                setShowMenu(false);
                handleDeleteMessage(message_id);
              }}
            />
          </View>
        </Popover>

        <Text
          className={`font-poppins-light text-xs mt-1 ${
            isSender ? 'text-right text-white' : 'text-left text-[#F5829B]'
          }`}
        >
          {formattedTimestamp} {isEdited && '(edited)'}
        </Text>
      </View>

      {isSender && (
        <Image source={{ uri: sender_avatar_url }} className="w-8 h-8 rounded-full ml-2 mt-1" />
      )}
    </View>
  );
}
