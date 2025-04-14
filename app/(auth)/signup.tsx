import * as React from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import AuthLayout from '@/components/AuthLayout'
import FormInput from '@/components/FormInput'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    console.log(emailAddress, password)

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  if (pendingVerification) {
    return (
      <>
      
      <AuthLayout activeTab = 'sign-up' onTabChange = {(tab) => router.replace(tab === 'sign-in' ? '/signin' : '/signup')}>
        <View style={{ width: 300 }}><FormInput label="Verify your email" borderColor= "#F5829B"autoCapitalize="none"
          value={code}
          placeholder="Enter verification code"
          onChangeText={(code) => setCode(code)}
        /></View>
        <TouchableOpacity onPress={onVerifyPress} style ={{backgroundColor: '#F5829B', padding: 10, borderRadius: 10, width: 300, alignItems: 'center', marginBlock:10}}>
          <Text style={{color: 'white', fontSize: 16, fontFamily:"Poppins-Regular"}}>Verify</Text>
        </TouchableOpacity>
        </AuthLayout> 
       </>
      
    )
  }

  return (
    <AuthLayout activeTab = 'sign-up' onTabChange = {(tab) => router.replace(tab === 'sign-in' ? '/signin' : '/signup')}>
      <>
        <View style={{ width: 300 }}>
                <FormInput label="Email Address" borderColor= "#F5829B"autoCapitalize="none"
                value={emailAddress}
                placeholder="Sample@domain.com"
                onChangeText={(emailAddress) => setEmailAddress(emailAddress)
                }>

                </FormInput>
              
              <FormInput label="Password" borderColor= "#F5829B"autoCapitalize="none"
                value={password}
                placeholder="Sample@domain.com"
                secureTextEntry={true}
                onChangeText={(password) => setPassword(password)
                }></FormInput></View>
        <TouchableOpacity onPress={onSignUpPress} style ={{backgroundColor: '#F5829B', padding: 10, borderRadius: 10, width: 300, alignItems: 'center', marginBlock:10}}>
          <Text style={{color: 'white', fontSize: 16, fontFamily:"Poppins-Regular"}}>Next</Text>
        </TouchableOpacity>
        <View style={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
          <Text style={{fontFamily:"Poppins-Regular"}} >Already have an account?</Text>
          <Link href="/signin">
            <Text>Sign in</Text>
          </Link>
        </View>
      </>
    </AuthLayout>
  )
}