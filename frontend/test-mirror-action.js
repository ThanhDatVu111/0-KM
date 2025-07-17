const { createClient } = require('@supabase/supabase-js');

// Test the mirror action approach
async function testMirrorAction() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  console.log('🧪 Testing Mirror Action Approach...\n');

  // Test 1: Create a playback command
  console.log('1. Testing command creation...');
  try {
    const { data: command, error } = await supabase
      .from('playback_commands')
      .insert({
        room_id: 'test-room-id',
        command: 'play',
        track_uri: 'spotify:track:test123',
        position_ms: 0,
        requested_at: new Date().toISOString(),
        requested_by_user_id: 'test-user-id',
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Command creation failed:', error.message);
    } else {
      console.log('✅ Command created successfully:', command.id);
    }
  } catch (error) {
    console.log('❌ Command creation error:', error.message);
  }

  // Test 2: Subscribe to real-time updates
  console.log('\n2. Testing real-time subscription...');
  try {
    const channel = supabase
      .channel('test-playback-commands')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'playback_commands',
        },
        (payload) => {
          console.log('✅ Real-time event received:', payload.new);
        },
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    // Wait a bit for subscription to establish
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Clean up subscription
    supabase.removeChannel(channel);
  } catch (error) {
    console.log('❌ Real-time subscription error:', error.message);
  }

  // Test 3: Query recent commands
  console.log('\n3. Testing command retrieval...');
  try {
    const { data: commands, error } = await supabase
      .from('playback_commands')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('❌ Command retrieval failed:', error.message);
    } else {
      console.log('✅ Retrieved commands:', commands.length);
      commands.forEach((cmd) => {
        console.log(`   - ${cmd.command} (${cmd.track_uri || 'no track'})`);
      });
    }
  } catch (error) {
    console.log('❌ Command retrieval error:', error.message);
  }

  console.log('\n🎉 Mirror Action Test Complete!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  testMirrorAction().catch(console.error);
}

module.exports = { testMirrorAction };
