const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function runMigration() {
  try {
    console.log('🔧 Running RLS disable migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'disable_rls_for_testing.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ RLS disabled successfully!');
    console.log('');
    console.log('📝 Note: This is a temporary fix for testing real-time functionality.');
    console.log('   In production, implement proper security measures.');
    console.log('');
    console.log('🔄 Real-time subscriptions should now work for:');
    console.log('   - room_spotify_tracks table');
    console.log('   - playback_commands table');
    console.log('   - playback_state table');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
