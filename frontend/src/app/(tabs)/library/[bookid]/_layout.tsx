import React from 'react';
import { SafeAreaView } from 'react-native';
import { Slot, useLocalSearchParams } from 'expo-router';
import EntryHeader from '@/components/EntryHeader';

export default function Layout() {
  const { title } = useLocalSearchParams<{ title: string }>(); 
  return (
    <SafeAreaView className="flex-1"> #need to fix this
      <EntryHeader title={title} />
      <Slot />
    </SafeAreaView>
  );
}
