import supabase from '../../supabase/db';

//ROLE: Database access layer

export async function createUser(attrs: {
  email: string;
  user_id: string;
  username: string;
  birthdate?: string;
  photo_url?: string;
}) {
  const { data, error } = await supabase
    .from('users')
    .insert([attrs]) // insert 1 new row
    .select() // ask Supabase to send back the new row’s columns
    .single(); // “I know it’s exactly one row—give me the object directly”
  if (error) throw error;
  return data;
}
