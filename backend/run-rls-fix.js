const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runRlsFix() {
  try {
    console.log('🔧 Starting RLS fix migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'fix_rls_spotify.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded successfully');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ RLS fix migration completed successfully!');
    console.log('');
    console.log('🔒 Updated RLS policies for room_spotify_tracks:');
    console.log('   - Service role now has full access');
    console.log('   - Regular users still have room-based access');
    console.log('   - Authentication errors should be resolved');
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
}

runRlsFix();
