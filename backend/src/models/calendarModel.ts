import supabase from '../../supabase/db';


export async function checkRefreshToken(attrs: {
    user_id: string,
}) {
    const { data, error } = await supabase
        .from('access_tokens')
        .select()
        .eq('room_id', attrs.user_id)
        .single()
    if (error) throw error;
    if (data.refresh_token != null) {
        return true;
    }
    return false;
}

export async function updateToken(attrs: {
    user_id: string,
    refresh_token: string 
}) {
    const { data, error } = await supabase
        .from('access_tokens')
        .update({ refresh_token: attrs.refresh_token })
        .eq('user_id', attrs.user_id)
        .select()
        .single()
    if (error) throw error;
    return data
}