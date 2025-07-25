import { useSignIn, useSSO } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import FormInput from '@/components/FormInput';
import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import icons from '@/constants/icons';

const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignInForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // useWarmUpBrowser();

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('../(tabs)/home');
      } else {
        // Sign-in attempt incomplete
      }
    } catch (err: any) {
      const readableMessage =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Something went wrong. Please try again.';
      setError(readableMessage);
    }
  };

  // ✅ Sign in with Google (OAuth)
  // Handle any pending authentication sessions
  WebBrowser.maybeCompleteAuthSession();
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const onGoogleSignInPress = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/(tabs)/home');
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
      }
    } catch (err) {
      // Handle Google sign-in error silently
    }
  }, []);

  return (
    <View className="w-full">
      {/* Input Fields */}
      <FormInput
        label="Email Address"
        borderColor="#6536DD"
        autoCapitalize="none"
        value={emailAddress}
        placeholder=""
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
      />

      <FormInput
        label="Password"
        borderColor="#6536DD"
        autoCapitalize="none"
        value={password}
        placeholder=""
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      {error ? (
        <Text className="text-red-600 text-center mb-4" style={{ fontFamily: 'Poppins-Regular' }}>
          {error}
        </Text>
      ) : null}

      {/* Login Button */}
      <TouchableOpacity
        onPress={onSignInPress}
        className="w-full mb-4 bg-[#6536DD] border-4 border-black"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 8,
        }}
      >
        <View className="bg-[#6536DD] px-4 py-3">
          <Text
            className="text-white text-center text-[16px] font-bold"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            LOGIN
          </Text>
        </View>
      </TouchableOpacity>

      {/* Sign in with Google Button */}
      <TouchableOpacity
        onPress={onGoogleSignInPress}
        className="w-full mb-4 bg-white border-4 border-[#6536DD]"
        style={{
          shadowColor: '#6536DD',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 8,
        }}
      >
        <View className="bg-white px-4 py-3 flex-row justify-center">
          <Image
            source={icons.google_pixel}
            style={{
              width: 24,
              height: 24,
              marginRight: 8,
            }}
            resizeMode="contain"
          />

          <Text
            className="text-[#6536DD] text-center text-[16px] font-bold"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            SIGN IN WITH GOOGLE
          </Text>
        </View>
      </TouchableOpacity>

      {/* Forgot Password Link */}
      <TouchableOpacity onPress={() => router.push('../forgot-password')} className="mt-2">
        <Text
          className="text-[#6536DD] text-center text-[16px] underline"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          Forgot Password?
        </Text>
      </TouchableOpacity>
    </View>
  );
}
