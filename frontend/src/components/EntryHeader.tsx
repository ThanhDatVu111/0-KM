import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
}

const EntryHeader: React.FC<HeaderProps> = ({ title }) => {
  const router = useRouter();

  return (
    <View className="h-12 flex-row items-center px-4">
      <Pressable onPress={() => router.back()} className="justify-center">
        <Ionicons name="chevron-back" size={24} color="#000" />
      </Pressable>

      <View className="flex-1 items-center">
        <Text className="text-lg font-semibold">{title}</Text>
      </View>

      {/* Right spacer */}
      <View style={{ width: 24 }} />
    </View>
  );
};

export default EntryHeader;