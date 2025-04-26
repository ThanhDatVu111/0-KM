import { useSSO, useUser } from '@clerk/clerk-expo';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Button from './Button';
import icons from '@/constants/icons';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

type SocialLoginButtonProps = {
  label: string;
  strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_apple';
};

const strategyLabels = {
  oauth_google: 'Sign in with Google',
  oauth_facebook: 'Sign in with Facebook',
  oauth_apple: 'Sign in with Apple',
};

const strategyIcons = {
  oauth_google: icons.google,
  oauth_facebook: icons.facebook,
  oauth_apple: icons.apple,
};

export default function SocialLoginButton({
  strategy,
}: SocialLoginButtonProps) {
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const onPress = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy,
          // For web, defaults to current path
          // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
          // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
          redirectUrl: AuthSession.makeRedirectUri(),
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  }, []);

  return (
    <Button
      onPress={onPress}
      imgSrc={strategyIcons[strategy]}
      label={strategyLabels[strategy]}
      size="py-3 px-4"
      color="bg-accent"
      className="w-[300px] mb-3"
      textClassName="text-white text-16px]"
      textStyle={{ fontFamily: 'Poppins-Light' }}
    />
  );
}
