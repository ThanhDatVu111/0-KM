import supabase from '../../supabase/db';

//ROLE: Database access layer

export async function createUser(attrs: { email: string; user_id: string }) {
  const { data, error } = await supabase
    .from('users')
    .insert([attrs]) // insert 1 new row
    .select() // ask Supabase to send back the new row’s columns
    .single(); // “I know it’s exactly one row—give me the object directly”
  if (error) throw error;
  return data;
}
export async function updateUser(attrs: {
  user_id: string;
  username: string;
  birthdate: string;
  photo_url: string;
}) {
  const { data, error } = await supabase
    .from('users')
    .update({
      username: attrs.username,
      birthdate: attrs.birthdate,
      photo_url: attrs.photo_url,
    })
    .eq('user_id', attrs.user_id) // Match by user_id
    .select()
    .single();
  if (error) {
    console.error('error onboarding: ', error.message);
  }
  return data;
}

export async function getUser(userId: string) {
  const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single(); // This is where the error occurs

  if (error) {
    console.error('❌ Error fetching user:', error.message);
    throw error;
  }

  console.log('✅ User fetched:', data);
  return data;
}
