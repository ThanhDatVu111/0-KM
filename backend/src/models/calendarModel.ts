import supabase from '../../supabase/db';

export async function checkRefreshToken(attrs: { user_id: string }) {
  const { data, error } = await supabase
    .from('access_tokens')
    .select('refresh_token')
    .eq('user_id', attrs.user_id)
    .single(); // Get exactly one row

  if (error) throw error;
  if (!data.refresh_token) {
    return false;
  }
  return data.refresh_token != null;
}

export async function checkUserIdInTokenTable(attrs: { user_id: string }) {
  const { data, error } = await supabase
    .from('access_tokens')
    .select('user_id')
    .eq('user_id', attrs.user_id)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: No rows found
  return !!data;
}

export async function updateToken(attrs: { user_id: string; refresh_token: string }) {
  // Check if user_id exists
  const exists = await checkUserIdInTokenTable({ user_id: attrs.user_id });
  let data, error;
  if (exists) {
    // Update existing entry
    ({ data, error } = await supabase
      .from('access_tokens')
      .update({ refresh_token: attrs.refresh_token })
      .eq('user_id', attrs.user_id)
      .select()
      .single());
  } else {
    // Insert new entry
    ({ data, error } = await supabase
      .from('access_tokens')
      .insert({ user_id: attrs.user_id, refresh_token: attrs.refresh_token })
      .select()
      .single());
  }
  if (error) throw error;
  return data;
}

export async function fetchRefreshToken(attrs: { user_id: string }) {
  const { data, error } = await supabase
    .from('access_tokens')
    .select()
    .eq('user_id', attrs.user_id)
    .single();
  if (error) throw error;
  return data;
}
