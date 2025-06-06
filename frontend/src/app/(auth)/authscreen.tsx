import React, { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import SignInForm from './signin';
import SignUpForm from './signup';

export default function AuthScreen() {
  const [tab, setTab] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <AuthLayout activeTab={tab} onTabChange={setTab}>
      {tab === 'sign-in' ? <SignInForm /> : <SignUpForm />}
    </AuthLayout>
  );
}
