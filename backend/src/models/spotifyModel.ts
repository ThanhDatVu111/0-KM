import supabase from '../../utils/supabase';

// Store or update user's Spotify token
export async function upsertSpotifyToken(attrs: {
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}) {
  console.log('🔄 Upserting Spotify token for user:', attrs.user_id);

  try {
    const { data, error } = await supabase
      .from('spotify_tokens')
      .upsert([attrs], {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error in upsertSpotifyToken:', error);
      throw error;
    }

    console.log('✅ Spotify token upserted successfully');
    return data;
  } catch (error) {
    console.error('❌ Error in upsertSpotifyToken:', error);
    throw error;
  }
}

// Get user's Spotify token
export async function getSpotifyToken(user_id: string) {
  const { data, error } = await supabase
    .from('spotify_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user_id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

// Get partner's user ID from room
export async function getPartnerId(user_id: string) {
  const { data, error } = await supabase
    .from('room')
    .select('user_1, user_2')
    .or(`user_1.eq.${user_id},user_2.eq.${user_id}`)
    .eq('filled', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No room found
    }
    throw error;
  }

  if (!data) return null;

  // Return the partner's ID (the one that's not the current user)
  return data.user_1 === user_id ? data.user_2 : data.user_1;
}

// Update Spotify token (for refresh scenarios)
export async function updateSpotifyToken(attrs: {
  user_id: string;
  access_token: string;
  expires_at?: number;
}) {
  const { data, error } = await supabase
    .from('spotify_tokens')
    .update({
      access_token: attrs.access_token,
      expires_at: attrs.expires_at,
    })
    .eq('user_id', attrs.user_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
