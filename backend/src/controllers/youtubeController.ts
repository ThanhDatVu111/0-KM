import { Request, Response, NextFunction } from 'express';
import {
  createRoomVideo,
  getRoomVideo,
  updateRoomVideo,
  deleteRoomVideo,
  CreateRoomVideoRequest,
  UpdateRoomVideoRequest,
} from '../services/youtubeService';

/**
 * Create a new room YouTube video
 */
export async function createRoomYouTubeVideo(
  req: Request<{}, {}, { user_id: string; video_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id, video_id } = req.body;

    if (!user_id || !video_id) {
      res.status(400).json({ error: 'user_id and video_id are required' });
      return;
    }

    const request: CreateRoomVideoRequest = {
      user_id,
      video_id,
    };

    const video = await createRoomVideo(request);

    if (!video) {
      res.status(500).json({ error: 'Failed to create room video' });
      return;
    }

    res.status(201).json(video);
  } catch (error: any) {
    console.error('Error in createRoomYouTubeVideo controller:', error);

    if (error.message === 'User is not in a room') {
      res.status(400).json({ error: 'User must be in a room to add videos' });
      return;
    }

    next(error);
  }
}

/**
 * Get the current room YouTube video
 */
export async function getRoomYouTubeVideo(
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    const video = await getRoomVideo(user_id);

    if (!video) {
      res.status(404).json({ error: 'No video found for this room' });
      return;
    }

    res.status(200).json(video);
  } catch (error: any) {
    console.error('Error in getRoomYouTubeVideo controller:', error);
    next(error);
  }
}

/**
 * Update the current room YouTube video
 */
export async function updateRoomYouTubeVideo(
  req: Request<{ user_id: string }, {}, { video_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;
    const { video_id } = req.body;

    if (!user_id || !video_id) {
      res.status(400).json({ error: 'user_id and video_id are required' });
      return;
    }

    const request: UpdateRoomVideoRequest = {
      video_id,
    };

    const video = await updateRoomVideo(user_id, request);

    if (!video) {
      res.status(500).json({ error: 'Failed to update room video' });
      return;
    }

    res.status(200).json(video);
  } catch (error: any) {
    console.error('Error in updateRoomYouTubeVideo controller:', error);

    if (error.message === 'No video found for this room') {
      res.status(404).json({ error: 'No video found for this room' });
      return;
    }

    if (error.message === 'Only the user who added the video can update it') {
      res.status(403).json({ error: 'Only the user who added the video can update it' });
      return;
    }

    next(error);
  }
}

/**
 * Delete the current room YouTube video
 */
export async function deleteRoomYouTubeVideo(
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    const success = await deleteRoomVideo(user_id);

    if (!success) {
      res.status(404).json({ error: 'No video found to delete' });
      return;
    }

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleteRoomYouTubeVideo controller:', error);

    if (error.message === 'Only the user who added the video can delete it') {
      res.status(403).json({ error: 'Only the user who added the video can delete it' });
      return;
    }

    next(error);
  }
}

// Legacy functions for backward compatibility
export async function upsertYouTubeVideo(
  req: Request<{}, {}, { user_id: string; video_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id, video_id } = req.body;

    if (!user_id || !video_id) {
      res.status(400).json({ error: 'user_id and video_id are required' });
      return;
    }

    // Try to create room video first
    try {
      const request: CreateRoomVideoRequest = {
        user_id,
        video_id,
      };

      const video = await createRoomVideo(request);
      if (video) {
        res.status(201).json(video);
        return;
      }
    } catch (error: any) {
      if (error.message === 'User is not in a room') {
        // Fall back to legacy user-based video
        const { createVideo } = await import('../services/youtubeService');
        const video = await createVideo({ user_id, video_id });
        if (video) {
          res.status(201).json(video);
          return;
        }
      }
    }

    res.status(500).json({ error: 'Failed to create video' });
  } catch (error: any) {
    console.error('Error in upsertYouTubeVideo controller:', error);
    next(error);
  }
}

export async function getUserYouTubeVideo(
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    // Try to get room video first
    const roomVideo = await getRoomVideo(user_id);
    if (roomVideo) {
      res.status(200).json(roomVideo);
      return;
    }

    // Fall back to legacy user-based video
    const { getUserVideo } = await import('../services/youtubeService');
    const video = await getUserVideo(user_id);

    if (!video) {
      res.status(404).json({ error: 'No video found' });
      return;
    }

    res.status(200).json(video);
  } catch (error: any) {
    console.error('Error in getUserYouTubeVideo controller:', error);
    next(error);
  }
}

export async function getPartnerYouTubeVideo(
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    // Try to get room video first
    const roomVideo = await getRoomVideo(user_id);
    if (roomVideo) {
      res.status(200).json(roomVideo);
      return;
    }

    // Fall back to legacy partner video
    const { getPartnerVideo } = await import('../services/youtubeService');
    const video = await getPartnerVideo(user_id);

    if (!video) {
      res.status(404).json({ error: 'No partner video found' });
      return;
    }

    res.status(200).json(video);
  } catch (error: any) {
    console.error('Error in getPartnerYouTubeVideo controller:', error);
    next(error);
  }
}
