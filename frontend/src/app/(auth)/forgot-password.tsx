import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import FormInput from '@/components/FormInput';
import images from '@/constants/images'; 

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle sending the reset code to the user's email
  const sendResetCode = async () => {
    if (!isLoaded) return;
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setIsCodeSent(true);
      setError(null);
    } catch (err: any) {
      const readableMessage =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Something went wrong. Please try again.';
      setError(readableMessage);
    }
  };

  // Handle resetting the password
  const resetPassword = async () => {
    if (!isLoaded) return;
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('../(auth)/authscreen');
      } else {
        setError('Password reset incomplete.');
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
    <View className="flex-1 items-center justify-center bg-primary px-6">
      <Image source={images.logo} className="w-full max-h-28" resizeMode="contain" />
      <View className="w-[300px]">
        {!isCodeSent ? (
          <>
            <FormInput
              label=""
              borderColor="#F5829B"
              autoCapitalize="none"
              value={email}
              placeholder="Enter your email"
              onChangeText={setEmail}
            />
            <Button
              label="Send Reset Code"
              onPress={sendResetCode}
              size="py-3 px-4"
              color="bg-accent"
              className="w-full mb-3"
              textClassName="text-white text-[16px]"
              textStyle={{ fontFamily: 'Poppins-Regular' }}
            />
          </>
        ) : (
          <>
            <FormInput
              label="Verification Code"
              borderColor="#F5829B"
              value={code}
              placeholder="Enter verification code"
              onChangeText={setCode}
            />
            <FormInput
              label="New Password"
              borderColor="#F5829B"
              value={newPassword}
              placeholder="Enter new password"
              secureTextEntry
              onChangeText={setNewPassword}
            />
            <Button
              label="Reset Password"
              onPress={resetPassword}
              size="py-3 px-4"
              color="bg-accent"
              className="w-full mb-3"
              textClassName="text-white text-[16px]"
              textStyle={{ fontFamily: 'Poppins-Regular' }}
            />
          </>
        )}

        {error && (
          <Text className="text-red-600 text-center mb-2" style={{ fontFamily: 'Poppins-Regular' }}>
            {error}
          </Text>
        )}

        <Button
          label="I remember my password"
          onPress={() => router.push('../(auth)/authscreen')}
          size=""
          color=""
          className="w-full"
          textClassName="text-[16px] underline text-accent"
          textStyle={{ fontFamily: 'Poppins-Medium' }}
        />
      </View>
    </View>
  );
}