import { apiClient } from './apiClient';

export interface RoomYouTubeVideo {
  id: string;
  room_id: string;
  video_id: string;
  added_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomVideoRequest {
  user_id: string;
  video_id: string;
}

export interface UpdateRoomVideoRequest {
  video_id: string;
}

// Room-based video functions (new shared experience)
export async function createRoomVideo(
  request: CreateRoomVideoRequest,
  apiClientInstance: any,
): Promise<RoomYouTubeVideo> {
  const response = await apiClientInstance.post('/youtube/room', request);
  return response;
}

export async function getRoomVideo(
  user_id: string,
  apiClientInstance: any,
): Promise<RoomYouTubeVideo | null> {
  try {
    const response = await apiClientInstance.get(`/youtube/room/${user_id}`);
    return response;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateRoomVideo(
  user_id: string,
  request: UpdateRoomVideoRequest,
  apiClientInstance: any,
): Promise<RoomYouTubeVideo> {
  const response = await apiClientInstance.put(`/youtube/room/${user_id}`, request);
  return response;
}

export async function deleteRoomVideo(user_id: string, apiClientInstance: any): Promise<void> {
  await apiClientInstance.delete(`/youtube/room/${user_id}`);
}

// Legacy functions for backward compatibility
export interface YouTubeVideo {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
  updated_at: string;
}

export async function upsertYouTubeVideo(request: {
  user_id: string;
  video_id: string;
}): Promise<YouTubeVideo> {
  const response = await apiClient.post('/youtube', request);
  return response;
}

export async function getUserYouTubeVideo(request: {
  user_id: string;
}): Promise<YouTubeVideo | null> {
  try {
    const response = await apiClient.get(`/youtube/user/${request.user_id}`);
    return response;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getPartnerYouTubeVideo(request: {
  user_id: string;
}): Promise<YouTubeVideo | null> {
  try {
    const response = await apiClient.get(`/youtube/partner/${request.user_id}`);
    return response;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}
