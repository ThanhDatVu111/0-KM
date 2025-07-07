const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function runSpotifyMigration() {
  try {
    console.log('🚀 Starting Spotify tables migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'create_spotify_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded successfully');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Spotify tables migration completed successfully!');
    console.log('');
    console.log('📋 Created tables:');
    console.log('   - spotify_tracks (legacy individual tracks)');
    console.log('   - room_spotify_tracks (shared room tracks)');
    console.log('   - spotify_user_tokens (OAuth tokens)');
    console.log('');
    console.log('🔒 Row Level Security (RLS) policies applied');
    console.log('📊 Database indexes created for performance');
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
}

// Run the migration
runSpotifyMigration();
