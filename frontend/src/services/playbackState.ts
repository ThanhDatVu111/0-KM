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

type RoomPlaybackState = {
  is_playing?: boolean;
  current_track_uri?: string | null;
  progress_ms?: number;
  controlled_by_user_id?: string | null;
};

type RoomControllerSwitchResult = {
  controlled_by_user_id: string;
};

export async function switchRoomPlaybackController(
  roomId: string,
  currentUserId: string,
): Promise<RoomControllerSwitchResult> {
  const { data: roomData, error: roomError } = await supabase
    .from('room')
    .select('user_1, user_2, playback_state')
    .eq('room_id', roomId)
    .single();

  if (roomError || !roomData) {
    throw roomError || new Error('Room not found');
  }

  // Host-client model: only host (user_1) can change controller ownership.
  if (roomData.user_1 !== currentUserId) {
    throw new Error('Only the room host can switch controller');
  }

  const user1 = roomData.user_1 as string | null;
  const user2 = roomData.user_2 as string | null;
  if (!user1 || !user2) {
    throw new Error('Both users must be in the room to switch controller');
  }

  const playbackState: RoomPlaybackState = roomData.playback_state || {};
  const currentController = playbackState.controlled_by_user_id || currentUserId;
  const nextController = currentController === user1 ? user2 : user1;

  const nextPlaybackState: RoomPlaybackState = {
    ...playbackState,
    controlled_by_user_id: nextController,
  };

  const { error: updateError } = await supabase
    .from('room')
    .update({ playback_state: nextPlaybackState })
    .eq('room_id', roomId);

  if (updateError) {
    throw updateError;
  }

  return { controlled_by_user_id: nextController };
}
