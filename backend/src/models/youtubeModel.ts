import supabase from '../../utils/supabase';

export interface YouTubeVideo {
  id: string;
  user_id: string;
  video_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateYouTubeVideoInput {
  user_id: string;
  video_id: string;
  title?: string;
}

export interface UpdateYouTubeVideoInput {
  id: string;
  video_id?: string;
  title?: string;
}

/**
 * Create a new YouTube video entry
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
        title: input.title,
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
 * Get YouTube video by user ID
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
 * Update YouTube video
 */
export async function updateYouTubeVideo(
  input: UpdateYouTubeVideoInput,
): Promise<YouTubeVideo | null> {
  try {
    const updateData: any = {};
    if (input.video_id) updateData.video_id = input.video_id;
    if (input.title !== undefined) updateData.title = input.title;
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
 * Delete YouTube video
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
 * Get partner's YouTube video
 */
export async function getPartnerYouTubeVideo(user_id: string): Promise<YouTubeVideo | null> {
  try {
    // First get the partner's user ID
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
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
