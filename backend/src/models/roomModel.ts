import supabase from '../../supabase/db';

//ROLE: Database access layer

export async function createRoom(attrs: { room_id: string; user_1: string }) {
  const { data, error } = await supabase
    .from('room')
    .insert([attrs]) // insert 1 new row
    .select() // ask Supabase to send back the new row's columns
    .single(); // "I know it's exactly one row—give me the object directly"
  if (error) throw error;
  return data;
}

export async function checkRoom(attrs: { room_id: string }) {
  const { data, error } = await supabase
    .from('room')
    .select()
    .eq('room_id', attrs.room_id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return !!data;
}

export async function joinRoom(attrs: { room_id: string; user_2: string }) {
  const { data, error } = await supabase
    .from('room')
    .update({
      user_2: attrs.user_2,
      filled: true,
    })
    .eq('room_id', attrs.room_id) // Match the room by room_id
    .is('user_2', null) // Only update if user_2 is null
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoom(attrs: { room_id: string }): Promise<string | null> {
  const { data, error } = await supabase
    .from('room')
    .delete() // Return the deleted row(s)
    .eq('room_id', attrs.room_id)
    .select('room_id'); // Select only the room_id field

  if (error) throw error;

  // If a room was deleted, return its room_id; otherwise, return null
  return data?.[0]?.room_id || null;
}

export async function fetchRoom(user_id: string) {
  console.log('🔍 Fetching room for user:', user_id);

  const { data, error } = await supabase
    .from('room')
    .select('room_id, user_1, user_2, filled')
    .or(`user_1.eq.${user_id},user_2.eq.${user_id}`)
    .single();

  if (error) {
    console.error('❌ Raw error from database:', error);
    if (error.code === 'PGRST116') {
      console.log('❌ No room found for user:', user_id);
      return null;
    }
    throw error;
  }

  if (!data) {
    console.log('❌ No data returned from database for user:', user_id);
    return null;
  }

  console.log('✅ Room data found:', data);
  return data;
}

export async function updateRoom(room_id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('room')
    .update(updates)
    .eq('room_id', room_id)
    .select()
    .single();
  if (error) {
    console.error('❌ Supabase updateRoom error:', error);
    throw error;
  }
  return data;
}

export async function getRoomById(room_id: string) {
  const { data, error } = await supabase.from('room').select().eq('room_id', room_id).single();
  if (error) throw error;
  return data;
}
