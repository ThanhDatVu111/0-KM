import { useSSO } from '@clerk/clerk-expo';
import React, { useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Button from './Button';
import icons from '@/constants/icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function GoogleLoginButton() {
  const router = useRouter();
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const onPress = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/(auth)/authscreen');
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
    <TouchableOpacity
      onPress={onPress}
      className="w-full mb-4 bg-white border-4 border-[#6536DD]"
      style={{
        shadowColor: '#6536DD',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 8,
      }}
    >
      <View className="bg-white px-4 py-3">
        <Text
          className="text-[#6536DD] text-center text-[16px] font-bold"
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          SIGN IN WITH GOOGLE
        </Text>
      </View>
    </TouchableOpacity>
  );
}
