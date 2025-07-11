import React from 'react';
import { Stack } from 'expo-router';

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade', // Use native-stack's built-in fade transition
      }}
    />
  );
}
