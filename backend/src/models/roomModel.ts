import supabase from '../../utils/supabase';
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

export async function joinRoom(attrs: { room_id: string; user_id: string }) {
  // Fetch the room first
  const room = await getRoomById(attrs.room_id);
  if (!room) throw new Error('Room not found');

  // Prevent joining if user is already in the room
  if (room.user_1 === attrs.user_id || room.user_2 === attrs.user_id) {
    throw new Error('User already in this room');
  }

  let updates: any = {};
  if (!room.user_1) {
    updates.user_1 = attrs.user_id;
    updates.filled = !!room.user_2;
  } else if (!room.user_2) {
    updates.user_2 = attrs.user_id;
    updates.filled = !!room.user_1;
  } else {
    throw new Error('Room is already full');
  }

  const { data, error } = await supabase
    .from('room')
    .update(updates)
    .eq('room_id', attrs.room_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRoomForLeaving(room_id: string, user_id: string) {
  // Fetch the room to determine which user slot to clear
  const room = await getRoomById(room_id);
  if (!room) throw new Error('Room not found');
  let updates: any = {};
  // Determine which user slot to clear based on user_id
  if (room.user_1 === user_id) {
    updates = { user_1: null, filled: true };
  } else if (room.user_2 === user_id) {
    updates = { user_2: null, filled: true };
  } else {
    throw new Error('User not in this room');
  }
  const { data, error } = await supabase
    .from('room')
    .update(updates)
    .eq('room_id', room_id)
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

export async function getRoomById(room_id: string) {
  const { data, error } = await supabase.from('room').select().eq('room_id', room_id).single();
  if (error) throw error;
  return data;
}
