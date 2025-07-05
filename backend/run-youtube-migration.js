const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Running YouTube videos table migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'create_youtube_videos_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Migration SQL:');
    console.log(migrationSQL);

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ YouTube videos table migration completed successfully!');

    // Test the table by trying to select from it
    const { data, error: testError } = await supabase.from('youtube_videos').select('*').limit(1);

    if (testError) {
      console.error('❌ Table test failed:', testError);
      return;
    }

    console.log('✅ Table test successful - youtube_videos table is ready!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

runMigration();
