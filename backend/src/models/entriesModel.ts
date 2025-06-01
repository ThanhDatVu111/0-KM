import supabase from '../../supabase/db';

export async function getEntries(book_id: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('book_id', book_id)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching entries:', error.message);
    throw error;
  }

  console.log('✅ Entries fetched:', data);
  return data;
}

export async function insertEntries(attrs: {
  id: string;
  book_id: string;
  title: string;
  body?: string | null;
  location?: object | null;
  pin: boolean;
  media: object[];
  created_at: string;
}) {
  const { data, error } = await supabase
    .from('entries')
    .insert([attrs]) // Insert the new entry
    .select() // Return the inserted entry
    .single(); // Expect exactly one row

  if (error) {
    console.error('❌ Error inserting entry:', error.message);
    throw error;
  }

  console.log('✅ Entry created:', data);
  return data;
}
