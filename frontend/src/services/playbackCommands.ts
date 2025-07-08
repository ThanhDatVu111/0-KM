import supabase from '@/utils/supabase';

export async function sendPlaybackCommand(roomId: string, action: string) {
  const { error } = await supabase.from('playback_commands').insert([{ room_id: roomId, action }]);
  if (error) throw error;
}

export async function sendPlayTrackCommand(roomId: string, trackUri: string) {
  const { error } = await supabase
    .from('playback_commands')
    .insert([{ room_id: roomId, action: 'play_track', track_uri: trackUri }]);
  if (error) throw error;
}
