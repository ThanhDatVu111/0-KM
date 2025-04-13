import * as React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import AuthLayout from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');

  //current bug: 

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
      let message = 'Something went wrong. Please try again.';

      if (Array.isArray(err?.errors)) {
        for (const error of err.errors) {
          const code = error?.code;
          const param = error?.meta?.paramName;

          if (code === 'form_identifier_exists') {
            message = 'This email is already in use. Try signing in.';
          } else if (code === 'form_password_strength_fail') {
            message = 'Your password is too weak. Try a stronger one.';
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

      console.error('Signup error:', JSON.stringify(err, null, 2));
      setError(message);
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
        router.replace('../(onboard)/page');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
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
        <Text
          className="text-xl mb-4 text-accent"
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Verify your email
        </Text>
        <TextInput
          value={code}
          placeholder="Enter your verification code"
          onChangeText={setCode}
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

  // ✅ Sign-up form UI
  return (
    <AuthLayout
      activeTab="sign-up"
      onTabChange={(tab) =>
        router.replace(tab === 'sign-in' ? '/signin' : '/signup')
      }
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
          placeholder="Password"
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

      {/* Google sign-up button */}
      <TouchableOpacity
        onPress={onGoogleSignUpPress}
        className="border border-accent py-3 rounded-lg w-[300px] items-center mb-3"
      >
        <Text
          className="text-accent text-[16px]"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          Sign up with Google
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}