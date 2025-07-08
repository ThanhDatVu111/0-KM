import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ucqgkjhqxrvkhcyciixi.supabase.co/';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWdramhxeHJ2a2hjeWNpaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMDEyNjIsImV4cCI6MjA2MDU3NzI2Mn0.STD9hAL92stt4AA2cfau_d5dStlpTeSvXqNyJTf-DzE';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
