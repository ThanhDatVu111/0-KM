import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import AuthLayout from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';
import React from 'react';
import Button from '@/components/Button';
import SocialLoginButton from '@/components/SocialLoginButton';

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

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
        router.replace('../(onboard)/page');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
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

  return (
    <AuthLayout
      activeTab="sign-in"
      onTabChange={(tab) => router.replace(tab === 'sign-in' ? '/signin' : '/signup')}
    >
      {/* Input Fields */}
      <View className="w-[300px]">
        <FormInput
          label="Email"
          borderColor="#F5829B"
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Sample@domain.com"
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        />

        <FormInput
          label="Password"
          borderColor="#F5829B"
          autoCapitalize="none"
          value={password}
          placeholder="••••••••"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />
      </View>

      {/* Login Button */}
      <Button
        label="Login"
        onPress={onSignInPress}
        size="py-3 px-4"
        color="bg-accent"
        className="w-[300px] mb-3"
        textClassName="text-white text-[16px]"
      />

      {/* Display the error message using error state */}
      {error ? (
        <Text
          className="text-red-600 text-center mb-2 w-[300px]"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          {error}
        </Text>
      ) : null}

      {/* Sign in with Google Button */}
      <SocialLoginButton label="Sign in with Google" strategy="oauth_google" />
      <SocialLoginButton label="Sign in with Apple" strategy="oauth_apple" />

      {/* Forgot Password Link */}
      <Button
        label="Forget Password?"
        onPress={() => router.push('../forgot-password')}
        size=""
        color=""
        className="mb-4"
        textClassName="text-[16px] underline text-accent"
        textStyle={{ fontFamily: 'Poppins-Medium' }}
      />
    </AuthLayout>
  );
}
