import * as React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import AuthLayout from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    console.log(emailAddress, password);

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/');
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 items-center justify-center bg-primary px-6">
        <Text
          className="text-xl mb-4 text-accent"
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Verify your email
        </Text>
        <TextInput
          value={code}
          placeholder="Enter verification code"
          onChangeText={(code) => setCode(code)}
          className="border border-accent bg-white px-4 py-3 rounded-lg w-[300px] mb-4"
        />
        <TouchableOpacity
          onPress={onVerifyPress}
          className="bg-accent py-3 rounded-lg w-[300px] items-center"
        >
          <Text
            className="text-white text-[16px]"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            Verify
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <AuthLayout
      activeTab="sign-up"
      onTabChange={(tab) =>
        router.replace(tab === 'sign-in' ? '/signin' : '/signup')
      }
    >
      <View className="w-[300px]">
        <FormInput
          label="Email Address"
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
          placeholder="Password"
          secureTextEntry={true}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity
        onPress={onSignUpPress}
        className="bg-accent py-3 rounded-lg w-[300px] items-center my-3"
      >
        <Text
          className="text-white text-[16px]"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          Next
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}
