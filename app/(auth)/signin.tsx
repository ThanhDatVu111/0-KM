import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    <AuthLayout activeTab = "sign-in" onTabChange = {(tab) => router.replace(tab === 'sign-in' ? '/signin' : '/signup')}>
      <View style={{ width: 300 }}>
        <FormInput label="Email Address" borderColor="#DDDDDD" autoCapitalize="none"
        value={emailAddress}
        placeholder="Sample@domain.com"
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)
        }></FormInput>
      
      <FormInput label="Password"borderColor="#DDDDDD" autoCapitalize="none"
        value={password}
        placeholder="Sample@domain.com"
        onChangeText={(password) => setPassword(password)
        }></FormInput></View>
        <TouchableOpacity onPress={onSignInPress} style ={{marginBottom:15}}>
                <Text style={{color: '#CF5771', fontSize: 16, textDecorationLine: 'underline'}}>Forget Password?</Text>
              </TouchableOpacity>

      <TouchableOpacity onPress={onSignInPress} style ={{backgroundColor: '#F5829B', padding: 10, borderRadius: 10, width: 300, alignItems: 'center', marginBottom:10}}>
                <Text style={{color: 'white', fontSize: 16}}>Login</Text>
              </TouchableOpacity>
      
      <View style={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
        <Text>Don't have an account?</Text>
        <Link href="/signup">
          <Text>Sign up</Text>
        </Link>
      </View>
    </AuthLayout>
  );
}