import supabase from '@/utils/supabase';

export async function sendPlaybackCommand(roomId: string, action: string, trackUri?: string) {
  const commandData: any = { room_id: roomId, action };
  if (trackUri) {
    commandData.track_uri = trackUri;
  }
  const { error } = await supabase.from('playback_commands').insert([commandData]);
  if (error) throw error;
}

export async function sendPlayTrackCommand(roomId: string, trackUri: string) {
  const { error } = await supabase
    .from('playback_commands')
    .insert([{ room_id: roomId, action: 'play_track', track_uri: trackUri }]);
  if (error) throw error;
}
