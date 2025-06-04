import supabase from '../../supabase/db';

// Fetch all preceding messages before opening the chatroom
export async function fetchMessages({
  room_id,
  pageParam = 0,
}: {
  room_id: string;
  pageParam?: number;
}) {
  const limit = 10; // Max 10 messages per page
  const from = pageParam * limit;
  const to = from + limit - 1;

  if (!room_id) return;

  const { data, error } = await supabase
    .from('chat')
    .select()
    .eq('room_id', room_id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Failed to fetch previous messages.', error.message);
    throw error;
  }

  return data.reverse(); // Reverse the ordering of the message, from latest
}

// Retrieve specific messages
export async function getMessageById(message_id: string) {
  if (!message_id) return;

  const { data, error } = await supabase
    .from('chat')
    .select()
    .eq('message_id', message_id)
    .single();

  if (error) {
    console.error('Failed to retrieve message.', error.message);
    throw error;
  }
  return data;
}

export async function sendMessage(attrs: {
  message_id: string;
  room_id: string;
  content: string;
  sender_id: string;
  created_at: string;
}) {
  if (!attrs.room_id || !attrs.content) return;
  const { data, error } = await supabase.from('chat').insert([attrs]).select().single(); // Expect 1 row

  if (error) {
    console.error('Failed to send message.', error.message);
    throw error;
  }
  return data;
}

export async function editMessage(attrs: { message_id: string; newInput: string }) {
  if (!attrs.message_id || !attrs.newInput) return;
  const message = await getMessageById(attrs.message_id);
  if (!message || message === attrs.newInput) return;

  const { data, error } = await supabase
    .from('chat')
    .update({ content: attrs.newInput })
    .eq('message_id', attrs.message_id)
    .select()
    .single(); // Only change 1 message at a time

  if (error) {
    console.error('Failed to update message.', error.message);
    throw error;
  }

  console.log('Message edited: ', data);
  return data;
}

export async function deleteMessage(message_id: string) {
  const { error } = await supabase.from('chat').delete().eq('message_id', message_id);

  if (error) {
    console.error('Failed to delete message.', error.message);
    throw error;
  }

  console.log(`Message ID ${message_id} deleted successfully.`);
}
