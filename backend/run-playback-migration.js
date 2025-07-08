const { createClient } = require('@supabase/supabase-js');
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
    console.log('🔄 Running playback state migration...');

    // Add playback_state column to room table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE room 
        ADD COLUMN IF NOT EXISTS playback_state JSONB 
        DEFAULT '{"is_playing": false, "current_track_uri": null, "progress_ms": 0, "controlled_by_user_id": null}'::jsonb;
      `,
    });

    if (alterError) {
      console.error('❌ Error adding playback_state column:', alterError);
      return;
    }

    // Create index for faster queries
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_room_playback_state 
        ON room USING GIN (playback_state);
      `,
    });

    if (indexError) {
      console.error('❌ Error creating index:', indexError);
      return;
    }

    console.log('✅ Playback state migration completed successfully!');
    console.log('   - Added playback_state column to room table');
    console.log('   - Created GIN index for faster queries');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
