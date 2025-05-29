import supabase from '../../supabase/db';

//ROLE: Database access layer


export async function checkCalendar(attrs: {
    room_id: string;
}) {
    const { data, error } = await supabase
        .from('calendar')
        .select()
        .eq('room_id', attrs.room_id);
    if (error) {
        console.error('error checking calendar:', error.message);
    }
    if (!data || data.length == 0) {
        return false;
    }
    return true;
};

export async function createCalendar(attrs: {
    room_id: string;
    user_1: string;
}) {
  const { data, error } = await supabase
    .from('calendar')
    .insert([attrs]) // insert 1 new row
    .select() 
    .single(); 
  if (error) throw error;
  return data;
}


export async function checkCalendarFilled(attrs: {
    room_id: string;
}) {
    const { data, error } = await supabase
        .from('calendar')
        .select()
        .eq('room_id', attrs.room_id)
        .single(); //single so that data is a row, not array of rows
    if (error) throw error;

    return data?.filled;
}