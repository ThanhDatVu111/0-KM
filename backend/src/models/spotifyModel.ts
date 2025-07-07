import supabase from '../../utils/supabase';

export interface RoomSpotifyTrack {
  id: string;
  room_id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string;
  duration_ms: number;
  track_uri: string;
  added_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomSpotifyTrackInput {
  room_id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string;
  duration_ms: number;
  track_uri: string;
  added_by_user_id: string;
}

export interface UpdateRoomSpotifyTrackInput {
  id: string;
  track_id?: string;
  track_name?: string;
  artist_name?: string;
  album_name?: string;
  album_art_url?: string;
  duration_ms?: number;
  track_uri?: string;
}

/**
 * Create a new room Spotify track entry
 */
export async function createRoomSpotifyTrack(
  input: CreateRoomSpotifyTrackInput,
  supabaseClient?: any,
): Promise<RoomSpotifyTrack | null> {
  try {
    const client = supabaseClient || supabase;
    
    // First, delete any existing track for this room
    await deleteRoomSpotifyTrackByRoomId(input.room_id, client);

    const { data, error } = await client
      .from('room_spotify_tracks')
      .insert({
        room_id: input.room_id,
        track_id: input.track_id,
        track_name: input.track_name,
        artist_name: input.artist_name,
        album_name: input.album_name,
        album_art_url: input.album_art_url,
        duration_ms: input.duration_ms,
        track_uri: input.track_uri,
        added_by_user_id: input.added_by_user_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room Spotify track:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createRoomSpotifyTrack:', error);
    return null;
  }
}

/**
 * Get Spotify track by room ID
 */
export async function getRoomSpotifyTrack(room_id: string): Promise<RoomSpotifyTrack | null> {
  try {
    const { data, error } = await supabase
      .from('room_spotify_tracks')
      .select('*')
      .eq('room_id', room_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error getting room Spotify track:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getRoomSpotifyTrack:', error);
    return null;
  }
}

/**
 * Update room Spotify track
 */
export async function updateRoomSpotifyTrack(
  input: UpdateRoomSpotifyTrackInput,
): Promise<RoomSpotifyTrack | null> {
  try {
    const updateData: any = {};
    if (input.track_id) updateData.track_id = input.track_id;
    if (input.track_name) updateData.track_name = input.track_name;
    if (input.artist_name) updateData.artist_name = input.artist_name;
    if (input.album_name) updateData.album_name = input.album_name;
    if (input.album_art_url) updateData.album_art_url = input.album_art_url;
    if (input.duration_ms) updateData.duration_ms = input.duration_ms;
    if (input.track_uri) updateData.track_uri = input.track_uri;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('room_spotify_tracks')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating room Spotify track:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateRoomSpotifyTrack:', error);
    return null;
  }
}

/**
 * Delete room Spotify track by ID
 */
export async function deleteRoomSpotifyTrack(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('room_spotify_tracks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting room Spotify track:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteRoomSpotifyTrack:', error);
    return false;
  }
}

/**
 * Delete room Spotify track by room ID
 */
export async function deleteRoomSpotifyTrackByRoomId(room_id: string, supabaseClient?: any): Promise<boolean> {
  try {
    const client = supabaseClient || supabase;
    const { error } = await client.from('room_spotify_tracks').delete().eq('room_id', room_id);

    if (error) {
      console.error('Error deleting room Spotify track by room ID:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteRoomSpotifyTrackByRoomId:', error);
    return false;
  }
}

/**
 * Get room ID for a user
 */
export async function getRoomIdForUser(user_id: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('room')
      .select('room_id')
      .or(`user_1.eq.${user_id},user_2.eq.${user_id}`)
      .eq('filled', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data.room_id;
  } catch (error) {
    console.error('Error in getRoomIdForUser:', error);
    return null;
  }
}

// Legacy functions for backward compatibility (can be removed later)
export interface SpotifyTrack {
  id: string;
  user_id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string;
  duration_ms: number;
  track_uri: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSpotifyTrackInput {
  user_id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string;
  duration_ms: number;
  track_uri: string;
}

export interface UpdateSpotifyTrackInput {
  id: string;
  track_id?: string;
  track_name?: string;
  artist_name?: string;
  album_name?: string;
  album_art_url?: string;
  duration_ms?: number;
  track_uri?: string;
}

/**
 * Create a new Spotify track entry (legacy)
 */
export async function createSpotifyTrack(
  input: CreateSpotifyTrackInput,
): Promise<SpotifyTrack | null> {
  try {
    // Delete any existing track for this user
    await deleteSpotifyTrackByUserId(input.user_id);

    const { data, error } = await supabase
      .from('spotify_tracks')
      .insert({
        user_id: input.user_id,
        track_id: input.track_id,
        track_name: input.track_name,
        artist_name: input.artist_name,
        album_name: input.album_name,
        album_art_url: input.album_art_url,
        duration_ms: input.duration_ms,
        track_uri: input.track_uri,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Spotify track:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createSpotifyTrack:', error);
    return null;
  }
}

/**
 * Get Spotify track by user ID (legacy)
 */
export async function getSpotifyTrackByUserId(user_id: string): Promise<SpotifyTrack | null> {
  try {
    const { data, error } = await supabase
      .from('spotify_tracks')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error getting Spotify track by user ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSpotifyTrackByUserId:', error);
    return null;
  }
}

/**
 * Update Spotify track (legacy)
 */
export async function updateSpotifyTrack(
  input: UpdateSpotifyTrackInput,
): Promise<SpotifyTrack | null> {
  try {
    const updateData: any = {};
    if (input.track_id) updateData.track_id = input.track_id;
    if (input.track_name) updateData.track_name = input.track_name;
    if (input.artist_name) updateData.artist_name = input.artist_name;
    if (input.album_name) updateData.album_name = input.album_name;
    if (input.album_art_url) updateData.album_art_url = input.album_art_url;
    if (input.duration_ms) updateData.duration_ms = input.duration_ms;
    if (input.track_uri) updateData.track_uri = input.track_uri;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('spotify_tracks')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Spotify track:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateSpotifyTrack:', error);
    return null;
  }
}

/**
 * Delete Spotify track by ID (legacy)
 */
export async function deleteSpotifyTrack(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('spotify_tracks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting Spotify track:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSpotifyTrack:', error);
    return false;
  }
}

/**
 * Delete Spotify track by user ID (legacy)
 */
export async function deleteSpotifyTrackByUserId(user_id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('spotify_tracks').delete().eq('user_id', user_id);

    if (error) {
      console.error('Error deleting Spotify track by user ID:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSpotifyTrackByUserId:', error);
    return false;
  }
}

/**
 * Get partner's Spotify track (legacy)
 */
export async function getPartnerSpotifyTrack(user_id: string): Promise<SpotifyTrack | null> {
  try {
    // First get the partner's user ID
    const { data: roomData, error: roomError } = await supabase
      .from('room')
      .select('user_1, user_2')
      .or(`user_1.eq.${user_id},user_2.eq.${user_id}`)
      .eq('filled', true)
      .single();

    if (roomError || !roomData) {
      return null;
    }

    // Determine partner ID
    const partnerId = roomData.user_1 === user_id ? roomData.user_2 : roomData.user_1;

    // Get partner's Spotify track
    return await getSpotifyTrackByUserId(partnerId);
  } catch (error) {
    console.error('Error in getPartnerSpotifyTrack:', error);
    return null;
  }
}
