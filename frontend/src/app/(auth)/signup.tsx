import * as React from 'react';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';
import FormInput from '@/components/FormInput';
import { SimpleSignOutButton } from '@/components/SignOutButton';

export default function SignUpForm() {
  const { isLoaded, signUp } = useSignUp();
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
      console.error('Sign-up error:', JSON.stringify(err, null, 2));
      const readableMessage =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Something went wrong. Please try again.';
      setError(readableMessage);
    }
  };

  return (
    <View>
      <View className="w-[300px]">
        <View className="flex-row justify-end mb-4">
          <SimpleSignOutButton />
        </View>
        <FormInput
          label="Email"
          borderColor="#F5829B"
          autoCapitalize="none"
          value={emailAddress}
          placeholder=""
          onChangeText={setEmailAddress}
        />
        <FormInput
          label="Password"
          borderColor="#F5829B"
          autoCapitalize="none"
          value={password}
          placeholder=""
          secureTextEntry={true}
          onChangeText={setPassword}
        />
      </View>

      {error ? (
        <Text
          className="text-red-600 text-center mb-2 w-[300px]"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          {error}
        </Text>
      ) : null}

      {/* Button to Sign Up */}
      <Button
        label="Next"
        onPress={onSignUpPress}
        size="py-3 px-4"
        color="bg-accent"
        className="w-[300px] items-center my-3"
        textClassName="text-white text-[16px]"
        textStyle={{ fontFamily: 'Poppins-Regular' }}
      />

      {/* Button to Sign Up with Google */}
      <Button
        label="Sign up with Google"
        onPress={() => console.log('Google Sign Up')} // Placeholder for Google sign-up logic
        size="py-3 px-4"
        color="border border-accent"
        className="w-[300px] items-center mb-3"
        textClassName="text-accent text-[16px]"
        textStyle={{ fontFamily: 'Poppins-Regular' }}
      />
    </View>
  );
}
