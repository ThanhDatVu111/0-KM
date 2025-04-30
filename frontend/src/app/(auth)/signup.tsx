import * as React from 'react';
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import Button from '@/app/components/Button';
import { useRouter } from 'expo-router';
import AuthLayout from '@/app/components/AuthLayout';
import FormInput from '@/app/components/FormInput';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // This useEffect creates a real-time countdown for the resend button.
  useEffect(() => {
    let interval: any;

    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000); // every 1 second (1000), minus 1 ((prev) => prev - 1)
    }

    return () => clearInterval(interval);
    // clearInterval delete the interval when the value of resendTimer changes
  }, [resendTimer]);

  // ✅ Sign up with email & password
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    console.log('📩 Sign-up input:', { emailAddress, password });

    try {
      await signUp.create({
        emailAddress,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const readableMessage =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Something went wrong. Please try again.';
      setError(readableMessage);
    }
  };

  // ✅ Verify code
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        const newUserId = signUpAttempt.createdUserId;
        console.log(newUserId); //check this
        router.replace({
          pathname: '../(onboard)/onboardingFlow',
          params: {
            email: emailAddress,
            userId: newUserId,
          },
        });
      } else {
        setError('The verification code is incorrect or expired. Please try again.'); //what the user sees
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const readableMessage =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Something went wrong during verification. Please check your connection and try again.'; //what the user sees

      setError(readableMessage);
    }
  };

  // ✅ Resend verification code
  const onResendCode = async () => {
    if (!isLoaded) return; // Make sure Clerk is fully loaded before trying to resend the code.
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' }); // Resend the verification code
      setResendTimer(120); // set 2 minutes timer
    } catch (err: any) {
      console.error('Resend code error:', JSON.stringify(err, null, 2));
      const readableMessage =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Failed to resend verification code. Please try again.';
      setError(readableMessage);
    }
  };

  // ✅ Sign up with Google (OAuth)
  const onGoogleSignUpPress = async () => {
    //need help here
  };

  // ✅ OTP Verification UI
  if (pendingVerification) {
    return (
      <View className="flex-1 items-center justify-center bg-primary px-6">
        <Text className="text-xl mb-4 text-accent" style={{ fontFamily: 'Poppins-Bold' }}>
          Verify your email
        </Text>
        <TextInput
          value={code}
          placeholder="Enter your verification code"
          onChangeText={setCode}
          className="border border-accent bg-white px-4 py-3 rounded-lg w-[300px] mb-4"
        />

        {/* Show error if exists */}
        {error ? (
          <Text
            className="text-red-600 text-center mb-2 w-[300px]"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {error}
          </Text>
        ) : null}

        <Button
          label="Verify"
          onPress={onVerifyPress}
          size="py-3 px-4"
          color="bg-accent"
          className="w-[300px] items-center"
          textClassName="text-white text-[16px]"
          textStyle={{ fontFamily: 'Poppins-Regular' }}
        />

        {/* ✅ Resend button or Timer */}
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

  // ✅ Sign-up form UI
  return (
    <AuthLayout
      activeTab="sign-up"
      onTabChange={(tab) => router.replace(tab === 'sign-in' ? '/signin' : '/signup')}
    >
      <View className="w-[300px]">
        <FormInput
          label="Email"
          borderColor="#F5829B"
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Sample@domain.com"
          onChangeText={setEmailAddress}
        />
        <FormInput
          label="Password"
          borderColor="#F5829B"
          autoCapitalize="none"
          value={password}
          placeholder="•••••••••••"
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
        onPress={onGoogleSignUpPress}
        size="py-3 px-4"
        color="border border-accent"
        className="w-[300px] items-center mb-3"
        textClassName="text-accent text-[16px]"
        textStyle={{ fontFamily: 'Poppins-Regular' }}
      />
    </AuthLayout>
  );
}
