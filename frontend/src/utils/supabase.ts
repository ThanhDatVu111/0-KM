import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ucqgkjhqxrvkhcyciixi.supabase.co/';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWdramhxeHJ2a2hjeWNpaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMDEyNjIsImV4cCI6MjA2MDU3NzI2Mn0.STD9hAL92stt4AA2cfau_d5dStlpTeSvXqNyJTf-DzE';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Enable real-time debugging
console.log('🔧 Supabase client initialized with real-time enabled');
console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Using environment variables:', {
  hasUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});
console.log('🔧 Real-time config:', {
  eventsPerSecond: 10,
  schema: 'public',
});

export default supabase;
