const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixSpotifyTable() {
  try {
    console.log('🔧 Fixing spotify_tokens table...');

    // Drop and recreate the table with correct column types
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop the existing table if it exists
        DROP TABLE IF EXISTS spotify_tokens;
        
        -- Create the table with correct column types
        CREATE TABLE spotify_tokens (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          expires_at BIGINT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index on user_id for faster lookups
        CREATE INDEX idx_spotify_tokens_user_id ON spotify_tokens(user_id);
        
        -- Add RLS (Row Level Security) policies
        ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Users can only access their own tokens
        CREATE POLICY "Users can view own spotify tokens" ON spotify_tokens
          FOR SELECT USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Users can insert own spotify tokens" ON spotify_tokens
          FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        
        CREATE POLICY "Users can update own spotify tokens" ON spotify_tokens
          FOR UPDATE USING (auth.uid()::text = user_id);
        
        CREATE POLICY "Users can delete own spotify tokens" ON spotify_tokens
          FOR DELETE USING (auth.uid()::text = user_id);
      `,
    });

    if (dropError) {
      console.error('❌ Failed to fix table:', dropError);
      console.log('💡 You may need to run this SQL manually in your Supabase dashboard:');
      console.log(`
        -- Drop the existing table if it exists
        DROP TABLE IF EXISTS spotify_tokens;
        
        -- Create the table with correct column types
        CREATE TABLE spotify_tokens (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          expires_at BIGINT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index on user_id for faster lookups
        CREATE INDEX idx_spotify_tokens_user_id ON spotify_tokens(user_id);
      `);
    } else {
      console.log('✅ Table fixed successfully!');

      // Test the table
      const { data, error } = await supabase.from('spotify_tokens').select('*').limit(1);

      if (error) {
        console.error('❌ Table test failed:', error);
      } else {
        console.log('✅ Table test successful!');
      }
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

fixSpotifyTable();
