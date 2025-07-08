import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ChatSettings() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all chat messages? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement clear chat functionality
            console.log('Clear chat history');
          },
        },
      ],
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You will no longer receive messages from them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement block user functionality
            console.log('Block user');
          },
        },
      ],
    );
  };

  const SettingItem = ({
    title,
    subtitle,
    value,
    onValueChange,
    type = 'switch',
    onPress,
    icon,
  }: {
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'button';
    onPress?: () => void;
    icon?: string;
  }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
      <View className="flex-1 flex-row items-center">
        {icon && <Ionicons name={icon as any} size={20} color="#F5829B" className="mr-3" />}
        <View className="flex-1">
          <Text className="text-base font-poppins-medium text-gray-900">{title}</Text>
          {subtitle && (
            <Text className="text-sm font-poppins-light text-gray-500 mt-1">{subtitle}</Text>
          )}
        </View>
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#D1D5DB', true: '#F5829B' }}
          thumbColor={value ? '#fff' : '#fff'}
        />
      )}
      {type === 'button' && (
        <TouchableOpacity onPress={onPress}>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Notifications Section */}
        <View className="mt-4">
          <Text className="text-lg font-poppins-bold text-gray-900 px-4 mb-2">Notifications</Text>
          <View className="bg-white">
            <SettingItem
              title="Push Notifications"
              subtitle="Receive notifications for new messages"
              value={notifications}
              onValueChange={setNotifications}
              icon="notifications"
            />
            <SettingItem
              title="Sound"
              subtitle="Play sound for new messages"
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              icon="volume-high"
            />
            <SettingItem
              title="Vibration"
              subtitle="Vibrate for new messages"
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              icon="phone-portrait"
            />
          </View>
        </View>

        {/* Chat Settings Section */}
        <View className="mt-6">
          <Text className="text-lg font-poppins-bold text-gray-900 px-4 mb-2">Chat Settings</Text>
          <View className="bg-white">
            <SettingItem
              title="Read Receipts"
              subtitle="Show when messages are read"
              value={readReceipts}
              onValueChange={setReadReceipts}
              icon="checkmark-circle"
            />
            <SettingItem
              title="Typing Indicators"
              subtitle="Show when someone is typing"
              value={typingIndicators}
              onValueChange={setTypingIndicators}
              icon="chatbubble-ellipses"
            />
          </View>
        </View>

        {/* Actions Section */}
        <View className="mt-6">
          <Text className="text-lg font-poppins-bold text-gray-900 px-4 mb-2">Actions</Text>
          <View className="bg-white">
            <SettingItem
              title="Clear Chat History"
              subtitle="Delete all messages in this chat"
              type="button"
              onPress={handleClearChat}
              icon="trash"
            />
            <SettingItem
              title="Block User"
              subtitle="Block this user from messaging you"
              type="button"
              onPress={handleBlockUser}
              icon="ban"
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View className="mt-6 mb-8">
          <Text className="text-lg font-poppins-bold text-gray-900 px-4 mb-2">Privacy</Text>
          <View className="bg-white">
            <SettingItem
              title="Last Seen"
              subtitle="Show when you were last active"
              type="button"
              onPress={() => console.log('Last seen settings')}
              icon="time"
            />
            <SettingItem
              title="Profile Photo"
              subtitle="Who can see your profile photo"
              type="button"
              onPress={() => console.log('Profile photo settings')}
              icon="person"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
