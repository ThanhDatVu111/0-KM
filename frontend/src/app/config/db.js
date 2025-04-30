import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-expo';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// export default supabase;
export const useSupabase = () => {
  const { getToken } = useAuth();
  return createClient(supabaseUrl, supabaseKey, {
    accessToken: async () => getToken() ?? null,
  });
};
