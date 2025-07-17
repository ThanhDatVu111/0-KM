import * as React from 'react';
import { useState } from 'react';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import { useSignUp, useSSO, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import FormInput from '@/components/FormInput';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import icons from '@/constants/icons';
import { createUser } from '@/apis/user';

const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignUpForm() {
  const { isLoaded, signUp } = useSignUp();
  const { userId, getToken } = useAuth();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ✅ Sign up with email & password
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    console.log('📩 Sign-up input:', { emailAddress, password });

    try {
      // Create a new user with Clerk
      await signUp.create({
        emailAddress,
        password,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Navigate to the verify-email page
      router.replace({
        pathname: '../(auth)/verify-email',
        params: { emailAddress }, // Pass emailAddress to the verification page
      });
    } catch (err: any) {
      const readableMessage =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Something went wrong. Please try again.';
      setError(readableMessage);
    }
  };

  // ✅ Sign up with Google (OAuth)
  // Handle any pending authentication sessions
  WebBrowser.maybeCompleteAuthSession();
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const onGoogleSignUpPress = React.useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });

        // Wait for session to be established
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get the JWT token to extract user info
        const token = await getToken();
        if (token) {
          // Decode JWT to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          const googleUserId = payload.sub; // Clerk user ID
          const googleEmail = payload.email; // User's email from Google

          console.log('✅ Google user info:', { googleUserId, googleEmail });

          // Create user in database
          const createdUser = await createUser({
            email: googleEmail || 'no-email@example.com',
            user_id: googleUserId,
          });
          console.log('✅ New Google user saved to database:', createdUser);

          router.replace({
            pathname: '/(onboard)/onboarding-flow',
            params: {
              user_id: googleUserId,
            },
          });
        } else {
          console.error('❌ No token available after Google authentication');
        }
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
      }
    } catch (err) {
      // Handle Google sign-up error silently
    }
  }, [getToken]);

  return (
    <View className="w-full">
      {/* Input Fields */}
      <FormInput
        label="Email Address"
        borderColor="#6536DD"
        autoCapitalize="none"
        value={emailAddress}
        placeholder=""
        onChangeText={setEmailAddress}
      />
      <FormInput
        label="Password"
        borderColor="#6536DD"
        autoCapitalize="none"
        value={password}
        placeholder=""
        secureTextEntry={true}
        onChangeText={setPassword}
      />

      {/* Display the error message using error state */}
      {error ? (
        <Text className="text-red-600 text-center mb-4" style={{ fontFamily: 'Poppins-Regular' }}>
          {error}
        </Text>
      ) : null}

      {/* Sign Up Button */}
      <TouchableOpacity
        onPress={onSignUpPress}
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
            NEXT
          </Text>
        </View>
      </TouchableOpacity>

      {/* Sign up with Google Button */}
      <TouchableOpacity
        onPress={onGoogleSignUpPress}
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
            SIGN UP WITH GOOGLE
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
