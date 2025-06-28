import supabase from '../../utils/supabase';

export async function getEntries(book_id: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('book_id', book_id)
    .order('updated_at', { ascending: true });

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
  media_paths: string[];
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

export async function deleteEntries(book_id: string, entry_id: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('book_id', book_id)
    .eq('id', entry_id); // Match both book_id and entry_id

  if (error) {
    console.error('❌ Error deleting entry:', error.message);
    throw error;
  }
  console.log(`✅ Entry with ID ${entry_id} deleted successfully`);
}

export async function updateEntries(attrs: {
  id: string;
  book_id: string;
  title: string;
  body?: string | null;
  location?: object | null;
  media: object[];
  updated_at: string;
}) {
  const { data, error } = await supabase
    .from('entries')
    .update({
      title: attrs.title,
      body: attrs.body,
      location: attrs.location,
      media: attrs.media,
      updated_at: attrs.updated_at,
    })
    .eq('id', attrs.id)
    .eq('book_id', attrs.book_id)
    .select()
    .single(); // Expect exactly one row

  if (error) {
    console.error('❌ Error updating entry:', error.message);
    throw error;
  }

  console.log('✅ Entry updated:', data);
  return data;
}
