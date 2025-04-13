import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState('');

  const handleError = (err: any) => {
    console.error('Clerk error:', JSON.stringify(err, null, 2));

    let message = 'Something went wrong. Please try again.';

    if (Array.isArray(err?.errors)) {
      for (const error of err.errors) {
        const code = error?.code;
        const param = error?.meta?.paramName;

        if (code === 'form_identifier_not_found') {
          message = 'No account is associated with this email. Please sign up.';
        } else if (
          code === 'form_param_format_invalid' &&
          param === 'email_address'
        ) {
          message = 'Please enter a valid email.';
        } else if (code === 'form_code_incorrect') {
          message = 'The verification code is incorrect.';
        } else if (code === 'form_code_expired') {
          message = 'The code has expired. Please request a new one.';
        } else if (code === 'form_param_nil' && param === 'password') {
          message = 'Password is required.';
        } else if (code === 'form_password_pwned') {
          message = 'This password is too common. Please choose another.';
        }
      }
    } else if (err?.message) {
      // Handle raw fallback message if Clerk error format changes
      message = err.message;
    }

    setError(message);
  };

  // Handle sending the reset code to the user's email
  const sendResetCode = async () => {
    if (!isLoaded) return;
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setIsCodeSent(true);
      setError('');
    } catch (err) {
      handleError(err);
    }
  };

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
        router.replace('../(auth)/signin');
      } else {
        setError('Password reset incomplete.');
      }
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <View className="flex-1 justify-center bg-primary px-5">
      {!isCodeSent ? (
        //if code is not sent yet
        <>
          <Text
            className="mb-1 text-base text-black"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            Email
          </Text>
          <TextInput
            className="w-full h-[50px] border border-accent rounded-lg px-3 mb-5"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={{ fontFamily: 'Poppins-Regular' }}
          />
          {/*Button to send reset code*/}
          <TouchableOpacity
            className="bg-accent py-4 rounded-lg items-center mb-3"
            onPress={sendResetCode}
          >
            <Text className="text-white" style={{ fontFamily: 'Poppins-Bold' }}>
              Send Reset Code
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text
            className="mb-1 text-base text-black"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            Verification Code
          </Text>
          <TextInput
            className="w-full h-[50px] border border-gray-300 rounded-lg px-3 mb-5"
            placeholder="Enter verification code"
            value={code}
            onChangeText={setCode}
            style={{ fontFamily: 'Poppins-Regular' }}
          />
          <Text
            className="mb-1 text-base text-black"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            New Password
          </Text>
          <TextInput
            className="w-full h-[50px] border border-gray-300 rounded-lg px-3 mb-5"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={{ fontFamily: 'Poppins-Regular' }}
          />
          <TouchableOpacity
            className="bg-accent py-4 rounded-lg items-center mb-3"
            onPress={resetPassword}
          >
            <Text className="text-white" style={{ fontFamily: 'Poppins-Bold' }}>
              Reset Password
            </Text>
          </TouchableOpacity>
        </>
      )}
      {error ? (
        <Text
          className="text-red-600 mt-2 text-center"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          {error}
        </Text>
      ) : null}

      //* Back to Sign In */
      <TouchableOpacity
        onPress={() => router.push('../(auth)/signin')}
        className="mb-4 items-center"
      >
        <Text
          className="text-[16px] underline text-accent"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          I remember my password
        </Text>
      </TouchableOpacity>
    </View>
  );
}
