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
  const [error, setError] = React.useState('');

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
    } catch (err: any) {
      let message = 'Something went wrong. Please try again.';

      if (Array.isArray(err?.errors)) {
        for (const error of err.errors) {
          const code = error?.code;
          const param = error?.meta?.paramName;

          if (code === 'form_identifier_not_found') {
            message = 'No account found with this email. Please sign up.';
          } else if (code === 'form_password_incorrect') {
            message = 'Incorrect password. Please try again.';
          } else if (
            code === 'form_param_format_invalid' &&
            param === 'email_address'
          ) {
            message = 'Please enter a valid email address.';
          } else if (code === 'form_param_nil' && param === 'password') {
            message = 'Password is required.';
          } else if (
            code === 'form_param_unknown' &&
            param === 'email_address'
          ) {
            message = 'Email address is not recognized as a valid field.';
          }
        }
      }

      console.error('Sign-in error:', JSON.stringify(err, null, 2));
      setError(message);
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

      {/* Display the error message using error state */}
      {error ? (
        <Text
          className="text-red-600 text-center mb-2 w-[300px]"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          {error}
        </Text>
      ) : null}

      {/* Google sign-up button */}
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
