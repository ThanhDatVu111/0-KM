import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import AuthLayout from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';
import React from 'react';

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/');
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };


  return (
    <AuthLayout
      activeTab="sign-in"
      onTabChange={(tab) =>
        router.replace(tab === 'sign-in' ? '/signin' : '/signup')
      }
    >
      {/* Input Fields */}
      <View className="w-[300px]">
        <FormInput
          label="Email Address"
          borderColor="#DDDDDD"
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Sample@domain.com"
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        />

        <FormInput
          label="Password"
          borderColor="#DDDDDD"
          autoCapitalize="none"
          value={password}
          placeholder="••••••••"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />
      </View>

      {/* Login Button */}
      <TouchableOpacity
        onPress={onSignInPress}
        className="bg-accent py-3 rounded-lg w-[300px] items-center mb-3"
      >
        <Text
          className="text-white text-[16px]"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          Login
        </Text>
      </TouchableOpacity>

      {/* Forgot Password */}
      <TouchableOpacity
        onPress={() => router.push('../forgot-password')}
        className="mb-4"
      >
        <Text
          className="text-[16px] underline text-accent"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          Forget Password?
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}