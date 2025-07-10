import supabase from '../../utils/supabase';

//ROLE: Database access layer

export async function createUser(attrs: { email: string; user_id: string }) {
  const { data, error } = await supabase
    .from('users')
    .insert([attrs]) // insert 1 new row
    .select() // ask Supabase to send back the new row's columns
    .single(); // "I know it's exactly one row—give me the object directly"
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
  if (error) throw error;
  return data;
}

export async function getUser(userId: string) {
  console.log('📝 Attempting to fetch user from database with ID:', userId);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching user:', error.message, error.details);
    throw error;
  }

  if (!data) {
    console.log('❌ No user found with ID:', userId);
    return null;
  }

  console.log('✅ User fetched successfully:', data);
  return data;
}

export async function updateUserProfile(attrs: {
  user_id: string;
  username?: string;
  birthdate?: string;
  photo_url?: string;
  timezone?: string;
  location_latitude?: number;
  location_longitude?: number;
  location_city?: string;
  location_country?: string;
}) {
  const updateFields: any = {};
  if (attrs.username !== undefined) updateFields.username = attrs.username;
  if (attrs.birthdate !== undefined) updateFields.birthdate = attrs.birthdate;
  if (attrs.photo_url !== undefined) updateFields.photo_url = attrs.photo_url;
  if (attrs.timezone !== undefined) updateFields.timezone = attrs.timezone;
  if (attrs.location_latitude !== undefined)
    updateFields.location_latitude = attrs.location_latitude;
  if (attrs.location_longitude !== undefined)
    updateFields.location_longitude = attrs.location_longitude;
  if (attrs.location_city !== undefined) updateFields.location_city = attrs.location_city;
  if (attrs.location_country !== undefined) updateFields.location_country = attrs.location_country;

  const { data, error } = await supabase
    .from('users')
    .update(updateFields)
    .eq('user_id', attrs.user_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
