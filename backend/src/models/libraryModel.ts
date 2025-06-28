import supabase from '../../utils/supabase';

export async function createBook(attrs: { couple_id: string; title: string; color: string }) {
  const { data, error } = await supabase.from('library').insert([attrs]).select().single();
  if (error) throw error;
  return data;
}

export async function updateBook(id: string, attrs: { title?: string; color?: string }) {
  const { data, error } = await supabase
    .from('library')
    .update(attrs)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getBooks(couple_id: string) {
  const { data, error } = await supabase.from('library').select('*').eq('couple_id', couple_id);
  if (error) throw error;
  return data;
}

export async function getBook(id: string) {
  const { data, error } = await supabase.from('library').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function deleteBook(id: string) {
  const { error } = await supabase.from('library').delete().eq('id', id);
  if (error) throw error;
}
