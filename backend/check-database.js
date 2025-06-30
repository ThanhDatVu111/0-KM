const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAndCreateTable() {
  try {
    console.log('🔍 Checking if spotify_tokens table exists...');

    // Try to query the table
    const { data, error } = await supabase.from('spotify_tokens').select('*').limit(1);

    if (error) {
      console.log('❌ Table does not exist or error:', error.message);
      console.log('📝 Creating spotify_tokens table...');

      // Create the table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS spotify_tokens (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            expires_at BIGINT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create index on user_id for faster lookups
          CREATE INDEX IF NOT EXISTS idx_spotify_tokens_user_id ON spotify_tokens(user_id);
        `,
      });

      if (createError) {
        console.error('❌ Failed to create table:', createError);
        console.log('💡 You may need to run this SQL manually in your Supabase dashboard:');
        console.log(`
          CREATE TABLE IF NOT EXISTS spotify_tokens (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            expires_at BIGINT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_spotify_tokens_user_id ON spotify_tokens(user_id);
        `);
      } else {
        console.log('✅ Table created successfully!');
      }
    } else {
      console.log('✅ spotify_tokens table exists!');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkAndCreateTable();
