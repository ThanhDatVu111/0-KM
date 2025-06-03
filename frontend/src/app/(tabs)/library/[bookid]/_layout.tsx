import React from 'react';
import { SafeAreaView } from 'react-native';
import { Slot } from 'expo-router';
import EntryHeader from '@/components/EntryHeader';

export default function Layout() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Your reusable header */}
      <EntryHeader title="Travel story" />
      <Slot />
    </SafeAreaView>
  );
}
