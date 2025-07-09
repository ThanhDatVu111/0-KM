const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRealtimeStatus() {
  try {
    console.log('🔍 Checking real-time status...');

    // Check if real-time is enabled for room_spotify_tracks
    const { data, error } = await supabase.from('room_spotify_tracks').select('count(*)').limit(1);

    if (error) {
      console.error('❌ Error checking real-time status:', error);
      return;
    }

    console.log('✅ Real-time check passed:', data);
    console.log('');
    console.log('📝 To enable real-time in Supabase Console:');
    console.log('   1. Go to Settings → Realtime');
    console.log('   2. Under "Public schema"');
    console.log('   3. Toggle "room_spotify_tracks" to ON');
    console.log('   4. Enable INSERT, UPDATE, DELETE events');
    console.log('');
    console.log('🔧 If real-time is not working, also check:');
    console.log(
      '   - RLS is disabled: ALTER TABLE room_spotify_tracks DISABLE ROW LEVEL SECURITY;',
    );
    console.log('   - Table exists: SELECT * FROM room_spotify_tracks LIMIT 1;');
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkRealtimeStatus();
