import React from 'react';
import { Stack } from 'expo-router';

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Customize this based on your needs
      }}
    />
  );
}