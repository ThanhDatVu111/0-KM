import {
  createRoomYouTubeVideo,
  getRoomYouTubeVideo,
  updateRoomYouTubeVideo,
  deleteRoomYouTubeVideo,
  getRoomIdForUser,
  RoomYouTubeVideo,
  CreateRoomYouTubeVideoInput,
  UpdateRoomYouTubeVideoInput,
} from '../models/youtubeModel';

export interface CreateRoomVideoRequest {
  user_id: string;
  video_id: string;
}

export interface UpdateRoomVideoRequest {
  video_id: string;
}

/**
 * Create a new room YouTube video
 */
export async function createRoomVideo(
  request: CreateRoomVideoRequest,
): Promise<RoomYouTubeVideo | null> {
  try {
    // Get the room ID for the user
    const roomId = await getRoomIdForUser(request.user_id);
    if (!roomId) {
      throw new Error('User is not in a room');
    }

    const input: CreateRoomYouTubeVideoInput = {
      room_id: roomId,
      video_id: request.video_id,
      added_by_user_id: request.user_id,
    };

    return await createRoomYouTubeVideo(input);
  } catch (error) {
    console.error('Error in createRoomVideo service:', error);
    throw error;
  }
}

/**
 * Get the current room YouTube video
 */
export async function getRoomVideo(user_id: string): Promise<RoomYouTubeVideo | null> {
  try {
    // Get the room ID for the user
    const roomId = await getRoomIdForUser(user_id);
    if (!roomId) {
      return null; // User is not in a room
    }

    return await getRoomYouTubeVideo(roomId);
  } catch (error) {
    console.error('Error in getRoomVideo service:', error);
    throw error;
  }
}

/**
 * Update the current room YouTube video
 */
export async function updateRoomVideo(
  user_id: string,
  request: UpdateRoomVideoRequest,
): Promise<RoomYouTubeVideo | null> {
  try {
    // Get the current room video
    const currentVideo = await getRoomVideo(user_id);
    if (!currentVideo) {
      throw new Error('No video found for this room');
    }

    // Check if the user is the one who added the video
    if (currentVideo.added_by_user_id !== user_id) {
      throw new Error('Only the user who added the video can update it');
    }

    const input: UpdateRoomYouTubeVideoInput = {
      id: currentVideo.id,
      video_id: request.video_id,
    };

    return await updateRoomYouTubeVideo(input);
  } catch (error) {
    console.error('Error in updateRoomVideo service:', error);
    throw error;
  }
}

/**
 * Delete the current room YouTube video
 */
export async function deleteRoomVideo(user_id: string): Promise<boolean> {
  try {
    // Get the current room video
    const currentVideo = await getRoomVideo(user_id);
    if (!currentVideo) {
      return false; // No video to delete
    }

    // Check if the user is the one who added the video
    if (currentVideo.added_by_user_id !== user_id) {
      throw new Error('Only the user who added the video can delete it');
    }

    return await deleteRoomYouTubeVideo(currentVideo.id);
  } catch (error) {
    console.error('Error in deleteRoomVideo service:', error);
    throw error;
  }
}

// Legacy functions for backward compatibility
export interface CreateVideoRequest {
  user_id: string;
  video_id: string;
}

export interface UpdateVideoRequest {
  user_id: string;
  video_id: string;
}

/**
 * Create a new YouTube video (legacy)
 */
export async function createVideo(request: CreateVideoRequest) {
  try {
    const { createYouTubeVideo } = await import('../models/youtubeModel');
    return await createYouTubeVideo({
      user_id: request.user_id,
      video_id: request.video_id,
    });
  } catch (error) {
    console.error('Error in createVideo service:', error);
    throw error;
  }
}

/**
 * Get user's YouTube video (legacy)
 */
export async function getUserVideo(user_id: string) {
  try {
    const { getYouTubeVideoByUserId } = await import('../models/youtubeModel');
    return await getYouTubeVideoByUserId(user_id);
  } catch (error) {
    console.error('Error in getUserVideo service:', error);
    throw error;
  }
}

/**
 * Get partner's YouTube video (legacy)
 */
export async function getPartnerVideo(user_id: string) {
  try {
    const { getPartnerYouTubeVideo } = await import('../models/youtubeModel');
    return await getPartnerYouTubeVideo(user_id);
  } catch (error) {
    console.error('Error in getPartnerVideo service:', error);
    throw error;
  }
}
