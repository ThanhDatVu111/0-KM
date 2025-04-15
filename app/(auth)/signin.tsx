import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import AuthLayout from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';
import React from 'react';

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
    } catch (err:any) {
      const readableMessage =
        err?.errors?.[0]?.shortMessage ||
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Something went wrong. Please try again.';
      setError(readableMessage);
    }
  };

  // ✅ Sign up with Google (OAuth)
  const onGoogleSignInPress = async () => {
    //need help here
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

      {/*Button to login  - this can be change by using the button component*/}
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

      {/* Display the error message using error state */}
      {error ? (
        <Text
          className="text-red-600 text-center mb-2 w-[300px]"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          {error}
        </Text>
      ) : null}

      {/*Button to use google to signin  - this can be change by using the button component*/}
      <TouchableOpacity
        onPress={onGoogleSignInPress}
        className="border border-accent py-3 rounded-lg w-[300px] items-center mb-3"
      >
        <Text
          className="text-accent text-[16px]"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          Sign in with Google
        </Text>
      </TouchableOpacity>

      {/*Button to forgot password  - this can be change by using the button component*/}
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
