import React from 'react';
import { SafeAreaView } from 'react-native';
import { Slot, useLocalSearchParams } from 'expo-router';
import EntryHeader from '@/components/EntryHeader';

export default function Layout() {
  const { title } = useLocalSearchParams<{ title: string }>(); // Retrieve the title parameter
  console.log('Layout title:', title); // Log the title for debugging

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Your reusable header */}
      <EntryHeader title={title} />
      <Slot />
    </SafeAreaView>
  );
}
