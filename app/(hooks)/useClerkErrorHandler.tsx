import { useState } from 'react';

export default function useClerkErrorHandler() {
  //error can be a string or null
  const [error, setError] = useState<string | null>(null);

  const handleClerkError = (err: any) => {
    console.error('Clerk error:', JSON.stringify(err, null, 2));
    let message = 'Something went wrong. Please try again.';
    if (Array.isArray(err?.errors)) {
      for (const error of err.errors) {
        const code = error?.code;
        const param = error?.meta?.paramName;
        if (code === 'form_identifier_not_found') {
          message = 'No account is associated with this email. Please sign up.';
        } else if (code === 'form_password_incorrect') {
          message = 'Incorrect password. Please try again.';
        } else if (code === 'form_identifier_exists') {
          message = 'This email is already in use. Try signing in.';
        } else if (code === 'form_password_strength_fail') {
          message = 'Your password is too weak. Try a stronger one.';
        } else if (code === 'form_param_format_invalid' && param === 'email_address') {
          message = 'Please enter a valid email address.';
        } else if (code === 'form_param_nil' && param === 'password') {
          message = 'Password is required.';
        } else if (code === 'form_code_incorrect') {
          message = 'The verification code is incorrect.';
        } else if (code === 'form_code_expired') {
          message = 'The code has expired. Please request a new one.';
        } else if (code === 'form_password_pwned') {
          message = 'This password is too common. Please choose another.';
        } else if (code === 'form_param_unknown' && param === 'email_address') {
          message = 'Email field is not recognized. Please check your setup or try again later.';
        }
      }
    } else if (err?.message) {
      message = err.message;
    }
    setError(message);
  };
  return { error, setError, handleClerkError };
}
