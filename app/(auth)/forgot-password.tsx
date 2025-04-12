import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
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

  const sendResetCode = async () => {
    if (!isLoaded) return;
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setIsCodeSent(true);
      setError('');
    } catch (err: any) {
      if (err.errors) {
        console.error('Clerk error:', JSON.stringify(err.errors, null, 2));
        setError(err.errors[0]?.longMessage || 'Something went wrong');
      } else {
        console.error('Unexpected error:', err);
        setError('Unexpected error occurred');
      }
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
        router.replace('/');
      } else {
        setError('Password reset incomplete.');
      }
    } catch (err: any) {
      if (err.errors) {
        console.error('Clerk error:', JSON.stringify(err.errors, null, 2));
        setError(err.errors[0]?.longMessage || 'Something went wrong');
      } else {
        console.error('Unexpected error:', err);
        setError('Unexpected error occurred');
      }
    }
  };

  return (
    <View style={styles.container}>
      {!isCodeSent ? (
        <>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={sendResetCode}>
            <Text style={styles.buttonText}>Send Reset Code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter verification code"
            value={code}
            onChangeText={setCode}
          />
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={resetPassword}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5CDDE',
    justifyContent: 'center',
  },
  label: {
    marginBottom: 5,
    fontFamily: 'Poppins-Regular',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  button: {
    backgroundColor: '#F5829B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    fontFamily: 'Poppins-Regular',
  },
});
