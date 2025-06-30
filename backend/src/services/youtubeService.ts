import * as youtubeModel from '../models/youtubeModel';

/**
 * Create or update a user's YouTube video
 */
export async function upsertYouTubeVideo(input: {
  user_id: string;
  video_id: string;
  title?: string;
}) {
  try {
    // Check if user already has a YouTube video
    const existingVideo = await youtubeModel.getYouTubeVideoByUserId(input.user_id);

    if (existingVideo) {
      // Update existing video
      return await youtubeModel.updateYouTubeVideo({
        id: existingVideo.id,
        video_id: input.video_id,
        title: input.title,
      });
    } else {
      // Create new video
      return await youtubeModel.createYouTubeVideo(input);
    }
  } catch (error) {
    console.error('Error in upsertYouTubeVideo:', error);
    return null;
  }
}

/**
 * Get user's YouTube video
 */
export async function getUserYouTubeVideo(user_id: string) {
  return await youtubeModel.getYouTubeVideoByUserId(user_id);
}

/**
 * Get partner's YouTube video
 */
export async function getPartnerYouTubeVideo(user_id: string) {
  return await youtubeModel.getPartnerYouTubeVideo(user_id);
}

/**
 * Delete user's YouTube video
 */
export async function deleteUserYouTubeVideo(user_id: string) {
  try {
    const video = await youtubeModel.getYouTubeVideoByUserId(user_id);
    if (video) {
      return await youtubeModel.deleteYouTubeVideo(video.id);
    }
    return false;
  } catch (error) {
    console.error('Error in deleteUserYouTubeVideo:', error);
    return false;
  }
}
