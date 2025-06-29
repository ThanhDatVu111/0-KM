import React from 'react';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade', // Use native fade animation for smoother transitions
        gestureEnabled: true, // Allow swipe back
        animationDuration: 250, // Slightly faster
      }}
    />
  );
}
