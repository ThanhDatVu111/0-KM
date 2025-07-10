import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Popover, { PopoverPlacement } from 'react-native-popover-view';
import { Feather, Ionicons, Octicons } from '@expo/vector-icons';
import { useChatSocket } from '@/hooks/useSocketChat';
import icons from '@/constants/icons';

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

const Divider = () => <View className="h-[0.75px] my-1 bg-[#8150E0]" />;

const MenuItem = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#F8F9FA',
      borderBottomWidth: 2,
      borderBottomColor: '#8150E0',
    }}
  >
    <Text
      style={{
        fontFamily: 'PixelifySans',
        fontSize: 12,
        color: label.includes('DELETE') || label.includes('UNSEND') ? '#DC2626' : '#1F2937',
        fontWeight: 'bold',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
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

  const isMedia = Array.isArray(parsedMediaPaths) && parsedMediaPaths.length > 0;

  const { handleEditMessage, handleDeleteMessage } = useChatSocket({ room_id, user_id });

  return (
    <View className={`flex-row mb-3 px-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isSender && (
        <Image
          source={sender_avatar_url ? { uri: sender_avatar_url } : icons.user_icon_female}
          className="w-8 h-8 rounded-full mr-2 mt-1"
        />
      )}

      <View className="flex max-w-[80%] relative">
        {/* === MEDIA CONTAINER === */}
        {isMedia && (
          <View className={`flex-col ${isSender ? 'items-end' : 'items-start'}`}>
            {parsedMediaPaths.map((item, index) => (
              <Pressable
                key={index}
                className="p-1"
                onPress={() => {
                  // Your image viewer open logic here
                }}
              >
                <Image
                  source={{ uri: item }}
                  className="w-48 h-48 mb-2 rounded-lg"
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        )}

        {/* === CHAT BUBBLE + CONTEXT MENU === */}
        {!isMedia && (
          <>
            <Popover
              isVisible={showMenu}
              onRequestClose={() => setShowMenu(false)}
              from={
                <Pressable
                  className={`rounded-2xl border-4 px-4 py-2.5 bg-white ${isSender ? 'border-[#B5CBF9]' : 'border-[#F4BCF6]'}`}
                  onLongPress={() => setShowMenu(true)}
                  style={{
                    bottom: 3,
                    padding: 3,
                    elevation: 4,
                    zIndex: 10,
                    shadowColor: isSender ? '#B5CBF9' : '#F4BCF6',
                    shadowOffset: { width: isSender ? 1 : -1, height: 1 },
                    shadowOpacity: 4,
                    shadowRadius: 1,
                  }}
                >
                  <Text
                    className={`text-base text-black justify-center align-middle`}
                    style={{
                      fontFamily: 'PixelifySans',
                      fontSize: 16,
                    }}
                  >
                    {content}
                  </Text>
                </Pressable>
              }
              placement={isSender ? PopoverPlacement.LEFT : PopoverPlacement.RIGHT}
              popoverStyle={{
                borderRadius: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
                backgroundColor: 'white',
              }}
            >
              <MenuItem
                label="REPLY"
                icon={<Octicons name="reply" size={18} color="#8150E0" />}
                onPress={() => {
                  setShowMenu(false);
                  console.log('User replying');
                }}
              />
              <Divider />
              <MenuItem
                label="COPY"
                icon={<Feather name="copy" size={18} color="#8150E0" />}
                onPress={() => {
                  setShowMenu(false);
                  console.log('User copied text');
                }}
              />
              <Divider />
              <MenuItem
                label="EDIT"
                icon={<Feather name="edit-2" size={18} color="#8150E0" />}
                onPress={() => {
                  setShowMenu(false);
                  handleEditMessage(message_id, content ?? '');
                }}
              />
              <Divider />
              {isSender ? (
                <MenuItem
                  label="UNSEND"
                  icon={<Ionicons name="trash-outline" size={18} color="#DC2626" />}
                  onPress={() => {
                    setShowMenu(false);
                    handleDeleteMessage(message_id);
                  }}
                />
              ) : (
                <MenuItem
                  label="DELETE"
                  icon={<Ionicons name="trash-outline" size={18} color="#DC2626" />}
                  onPress={() => {
                    setShowMenu(false);
                    handleDeleteMessage(message_id);
                  }}
                />
              )}
            </Popover>
          </>
        )}

        {/* === TIMESTAMP === */}
        <Text
          style={{
            fontFamily: 'PixelifySans',
            fontSize: 12,
          }}
          className={` text-xs mt-1 text-white ${isSender ? 'text-right' : 'text-left'}`}
        >
          {formattedTimestamp} {isEdited && '(edited)'}
        </Text>
      </View>

      {/* Sender Avatar on the Right */}
      {isSender && (
        <Image
          source={sender_avatar_url ? { uri: sender_avatar_url } : icons.user_icon_female}
          className="w-10 h-10 rounded-full ml-2 mt-1"
        />
      )}
    </View>
  );
}
