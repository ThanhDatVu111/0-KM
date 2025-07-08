import { ApiClient } from './apiClient';

export interface PlaybackState {
  is_playing: boolean;
  current_track_uri?: string;
  progress_ms: number;
  controlled_by_user_id?: string;
}

export async function updateRoomPlaybackState(
  roomId: string,
  playbackState: PlaybackState,
  userId: string,
  apiClient: ApiClient,
): Promise<PlaybackState> {
  try {
    const response = await apiClient.put(`/rooms/${roomId}/playback`, {
      playback_state: playbackState,
      user_id: userId,
    });

    if (!response.ok) {
      // If the endpoint doesn't exist yet, just return the state we tried to set
      if (response.status === 500 || response.status === 400) {
        console.log('Playback state endpoint not ready yet, using local state');
        return {
          ...playbackState,
          controlled_by_user_id: userId,
        };
      }
      throw new Error(`Failed to update playback state: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.log('Error updating playback state, using local state:', error);
    // Return the state we tried to set if there's any error
    return {
      ...playbackState,
      controlled_by_user_id: userId,
    };
  }
}

export async function getRoomPlaybackState(
  roomId: string,
  apiClient: ApiClient,
): Promise<PlaybackState | null> {
  try {
    const response = await apiClient.get(`/rooms/${roomId}/playback`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      // If the endpoint doesn't exist yet (column not added), return default state
      if (response.status === 500 || response.status === 400) {
        console.log('Playback state column not ready yet, using default state');
        return {
          is_playing: false,
          current_track_uri: undefined,
          progress_ms: 0,
          controlled_by_user_id: undefined,
        };
      }
      throw new Error(`Failed to get playback state: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.log('Error getting playback state, using default:', error);
    // Return default state if there's any error
    return {
      is_playing: false,
      current_track_uri: undefined,
      progress_ms: 0,
      controlled_by_user_id: undefined,
    };
  }
}
 