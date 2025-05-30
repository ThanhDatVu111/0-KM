import React, { useState, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Button from '@/components/Button';
import { useSignUp } from '@clerk/clerk-expo';
import { createUser } from '@/apis/user';

export default function VerifyEmail() {
  const { emailAddress } = useLocalSearchParams(); // Get email from navigation params
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown for resend button
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle verification
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const { status, createdSessionId, createdUserId } =
        await signUp.attemptEmailAddressVerification({ code });

      if (status !== 'complete' || !createdUserId) {
        setError('Verification failed. Please try again.');
        return;
      }

      await setActive({ session: createdSessionId });

      const createdUser = await createUser({
        email: Array.isArray(emailAddress) ? emailAddress[0] : emailAddress,
        user_id: createdUserId,
      });
      console.log('✅ New user saved to database:', createdUser);

      // Redirect to onboarding
      router.replace({
        pathname: '/(onboard)/onboarding-flow',
        params: { user_id: createdUserId },
      });
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Something went wrong during verification. Please try again.';
      setError(msg);
    }
  };

  // Resend verification code
  const onResendCode = async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setResendTimer(120); // 2-minute timer
    } catch (err: any) {
      const readableMessage =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Failed to resend verification code. Please try again.';
      setError(readableMessage);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <Text className="text-md mb-4 text-accent text-center" style={{ fontFamily: 'Poppins-Bold' }}>
        A verification code has been sent to: {emailAddress}.
      </Text>
      <TextInput
        value={code}
        placeholder="Enter your verification code"
        onChangeText={setCode}
        className="border border-accent bg-white px-4 py-3 rounded-lg w-[300px] mb-4"
      />
      {error && (
        <Text
          className="text-red-600 text-center mb-2 w-[300px]"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          {error}
        </Text>
      )}
      <Button
        label="Verify"
        onPress={onVerifyPress}
        size="py-3 px-4"
        color="bg-accent"
        className="w-[300px] items-center"
        textClassName="text-white text-[16px]"
        textStyle={{ fontFamily: 'Poppins-Regular' }}
      />
      {resendTimer > 0 ? (
        <Text className="text-accent mb-4" style={{ fontFamily: 'Poppins-Regular' }}>
          You can resend code in {resendTimer} seconds
        </Text>
      ) : (
        <Button
          label="Resend Code"
          onPress={onResendCode}
          size="py-3 px-4"
          color="border border-accent"
          className="w-[300px] items-center mb-4"
          textClassName="text-accent text-[16px]"
          textStyle={{ fontFamily: 'Poppins-Regular' }}
        />
      )}
    </View>
  );
}