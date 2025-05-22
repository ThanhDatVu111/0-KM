import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <Redirect
        href={'../(onboard)/page'} //onboarding page to help couple create one room together
      />
    ); // home screen when land in
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    ></Stack>
  );
}
