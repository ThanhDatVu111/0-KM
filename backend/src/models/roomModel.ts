import supabase from '../../supabase/db';

//ROLE: Database access layer

export async function createRoom(attrs: { room_id: string; user_1: string }) {
  const { data, error } = await supabase
    .from('room')
    .insert([attrs]) // insert 1 new row
    .select() // ask Supabase to send back the new row’s columns
    .single(); // “I know it’s exactly one row—give me the object directly”
  if (error) throw error;
  return data;
}

export async function joinRoom(attrs: { room_id: string; user_2: string }) {
  const { data, error } = await supabase
    .from('room')
    .update({
      user_2: attrs.user_2,
      filled: true,
    })
    .eq('room_id', attrs.room_id)
    .is('user_2', null)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoom(attrs: { room_id: string }) {
  const { error } = await supabase.from('room').delete().eq('room_id', attrs.room_id);
  if (error) throw error;
}
