import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { createUser } from '@/apis/user';
import FormInput from '@/components/FormInput';
import images from '@/constants/images';

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
    <ImageBackground
      source={images.entry}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <View className="flex-1 items-center justify-center">
        {/* Retro Auth Container */}
        <View className="w-11/12 max-w-md bg-white shadow-2xl border-4 border-black rounded-lg">
          {/* Purple Header Section */}
          <View className="bg-[#6536DD] border-b-4 border-black px-4 py-4 items-center rounded-t-md">
            <Image
              source={images.VerifyEmail}
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
              {/* Instructions */}
              <Text
                className="text-gray-700 text-center mb-6 text-[14px]"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                A verification code has been sent to: {emailAddress}
              </Text>

              {/* Verification Code Input */}
              <FormInput
                label="Verification Code"
                borderColor="#6536DD"
                value={code}
                placeholder="Enter your verification code"
                onChangeText={setCode}
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

              {/* Verify Button */}
              <TouchableOpacity
                onPress={onVerifyPress}
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
                    VERIFY
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Resend Code Section */}
              {resendTimer > 0 ? (
                <Text
                  className="text-[#6536DD] text-center mb-4 mt-4"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  You can resend code in {resendTimer} seconds
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={onResendCode}
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
                      RESEND CODE
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Back to Sign Up Link */}
              <TouchableOpacity
                onPress={() => router.push('../(auth)/authscreen')}
                className="mt-2"
              >
                <Text
                  className="text-[#6536DD] text-center text-[14px] underline"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Wrong email? Back to Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}
