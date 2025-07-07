require('dotenv').config();

console.log('🔍 Checking environment variables...');
console.log('Current working directory:', process.cwd());
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log(
  'SUPABASE_SERVICE_ROLE_KEY:',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
);
console.log('PORT:', process.env.PORT || '3001 (default)');
console.log('LOCAL_URL:', process.env.LOCAL_URL || 'Not set');
console.log('PUBLIC_URL:', process.env.PUBLIC_URL || 'Not set');

// Show first few characters of keys if they exist
if (process.env.SUPABASE_URL) {
  console.log('SUPABASE_URL preview:', process.env.SUPABASE_URL.substring(0, 20) + '...');
}
if (process.env.SUPABASE_ANON_KEY) {
  console.log('SUPABASE_ANON_KEY preview:', process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...');
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing required Supabase environment variables!');
  console.error('Please make sure you have a .env file with:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Environment variables look good!');
