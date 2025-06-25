import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
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
    <ImageBackground
      source={images.entry}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 items-center justify-center">
            {/* Retro Auth Container */}
            <View className="w-11/12 max-w-md shadow-2xl border-4 border-black rounded-lg">
              {/* Purple Header Section */}
              <View className="bg-[#6536DD] border-b-4 border-black px-4 py-4 items-center rounded-t-md">
                <Image
                  source={images.ResetPassword}
                  className="w-56 h-16"
                  resizeMode="contain"
                  style={{
                    tintColor: undefined, // Ensure no color filtering
                  }}
                />
              </View>

              {/* White Form Section */}
              <View className="bg-white px-8 py-8 rounded-b-md">
                <View className="w-full">
                  {!isCodeSent ? (
                    <>
                      {/* Email Input */}

                      <FormInput
                        label="Email Address"
                        borderColor="#6536DD"
                        autoCapitalize="none"
                        value={email}
                        placeholder="Enter your email"
                        onChangeText={setEmail}
                      />
                      {/* Error Message */}
                      {error && (
                        <Text
                          className="text-red-600 text-center mb-4"
                          style={{ fontFamily: 'Poppins-Regular' }}
                        >
                          {error}
                        </Text>
                      )}

                      {/* Send Reset Code Button */}
                      <TouchableOpacity
                        onPress={sendResetCode}
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
                            SEND RESET CODE
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {/* Reset Password Form */}
                      <View className="mb-6">
                        <FormInput
                          label="Verification Code"
                          borderColor="#6536DD"
                          value={code}
                          placeholder="Enter verification code"
                          onChangeText={setCode}
                        />
                        <FormInput
                          label="New Password"
                          borderColor="#6536DD"
                          value={newPassword}
                          placeholder="Enter new password"
                          secureTextEntry
                          onChangeText={setNewPassword}
                        />
                      </View>

                      {/* Reset Password Button */}
                      <TouchableOpacity
                        onPress={resetPassword}
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
                            RESET PASSWORD
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Back to Login Link */}
                  <TouchableOpacity
                    onPress={() => router.push('../(auth)/authscreen')}
                    className="mt-2"
                  >
                    <Text
                      className="text-[#6536DD] text-center text-[16px] underline"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      I remember my password
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
