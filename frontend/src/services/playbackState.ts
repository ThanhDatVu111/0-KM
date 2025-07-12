import supabase from '@/utils/supabase';

export async function updatePlaybackState(
  roomId: string,
  isPlaying: boolean,
  currentTrackUri: string,
) {
  const { error } = await supabase.from('playback_state').upsert([
    {
      room_id: roomId,
      is_playing: isPlaying,
      current_track_uri: currentTrackUri,
      updated_at: new Date().toISOString(),
    },
  ]);
  if (error) throw error;
}

export async function getPlaybackState(roomId: string) {
  const { data, error } = await supabase
    .from('playback_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (error) throw error;
  return data;
}
