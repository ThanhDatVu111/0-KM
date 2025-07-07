import supabase from '../../utils/supabase';

export interface RoomYouTubeVideo {
  id: string;
  room_id: string;
  video_id: string;
  added_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomYouTubeVideoInput {
  room_id: string;
  video_id: string;
  added_by_user_id: string;
}

export interface UpdateRoomYouTubeVideoInput {
  id: string;
  video_id?: string;
}

/**
 * Create a new room YouTube video entry
 */
export async function createRoomYouTubeVideo(
  input: CreateRoomYouTubeVideoInput,
): Promise<RoomYouTubeVideo | null> {
  try {
    // First, delete any existing video for this room
    await deleteRoomYouTubeVideoByRoomId(input.room_id);

    const { data, error } = await supabase
      .from('room_youtube_videos')
      .insert({
        room_id: input.room_id,
        video_id: input.video_id,
        added_by_user_id: input.added_by_user_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room YouTube video:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createRoomYouTubeVideo:', error);
    return null;
  }
}

/**
 * Get YouTube video by room ID
 */
export async function getRoomYouTubeVideo(room_id: string): Promise<RoomYouTubeVideo | null> {
  try {
    const { data, error } = await supabase
      .from('room_youtube_videos')
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
      console.error('Error getting room YouTube video:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getRoomYouTubeVideo:', error);
    return null;
  }
}

/**
 * Update room YouTube video
 */
export async function updateRoomYouTubeVideo(
  input: UpdateRoomYouTubeVideoInput,
): Promise<RoomYouTubeVideo | null> {
  try {
    const updateData: any = {};
    if (input.video_id) updateData.video_id = input.video_id;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('room_youtube_videos')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating room YouTube video:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateRoomYouTubeVideo:', error);
    return null;
  }
}

/**
 * Delete room YouTube video by ID
 */
export async function deleteRoomYouTubeVideo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('room_youtube_videos').delete().eq('id', id);

    if (error) {
      console.error('Error deleting room YouTube video:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteRoomYouTubeVideo:', error);
    return false;
  }
}

/**
 * Delete room YouTube video by room ID
 */
export async function deleteRoomYouTubeVideoByRoomId(room_id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('room_youtube_videos').delete().eq('room_id', room_id);

    if (error) {
      console.error('Error deleting room YouTube video by room ID:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteRoomYouTubeVideoByRoomId:', error);
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
export interface YouTubeVideo {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateYouTubeVideoInput {
  user_id: string;
  video_id: string;
}

export interface UpdateYouTubeVideoInput {
  id: string;
  video_id?: string;
}

/**
 * Create a new YouTube video entry (legacy)
 */
export async function createYouTubeVideo(
  input: CreateYouTubeVideoInput,
): Promise<YouTubeVideo | null> {
  try {
    const { data, error } = await supabase
      .from('youtube_videos')
      .insert({
        user_id: input.user_id,
        video_id: input.video_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating YouTube video:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createYouTubeVideo:', error);
    return null;
  }
}

/**
 * Get YouTube video by user ID (legacy)
 */
export async function getYouTubeVideoByUserId(user_id: string): Promise<YouTubeVideo | null> {
  try {
    const { data, error } = await supabase
      .from('youtube_videos')
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
      console.error('Error getting YouTube video:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getYouTubeVideoByUserId:', error);
    return null;
  }
}

/**
 * Update YouTube video (legacy)
 */
export async function updateYouTubeVideo(
  input: UpdateYouTubeVideoInput,
): Promise<YouTubeVideo | null> {
  try {
    const updateData: any = {};
    if (input.video_id) updateData.video_id = input.video_id;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('youtube_videos')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating YouTube video:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateYouTubeVideo:', error);
    return null;
  }
}

/**
 * Delete YouTube video (legacy)
 */
export async function deleteYouTubeVideo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('youtube_videos').delete().eq('id', id);

    if (error) {
      console.error('Error deleting YouTube video:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteYouTubeVideo:', error);
    return false;
  }
}

/**
 * Get partner's YouTube video (legacy)
 */
export async function getPartnerYouTubeVideo(user_id: string): Promise<YouTubeVideo | null> {
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

    // Get partner's YouTube video
    return await getYouTubeVideoByUserId(partnerId);
  } catch (error) {
    console.error('Error in getPartnerYouTubeVideo:', error);
    return null;
  }
}
