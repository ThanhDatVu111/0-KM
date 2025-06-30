import * as youtubeService from '../services/youtubeService';
import { Request, Response, NextFunction } from 'express';

// Create or update YouTube video
export async function upsertYouTubeVideo(
  req: Request<{}, {}, { user_id: string; video_id: string; title?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    console.log('🔄 Received YouTube video upsert request');
    console.log('📝 Request body:', req.body);

    const { user_id, video_id, title } = req.body;

    if (!user_id || !video_id) {
      console.error('❌ Missing required fields:', {
        user_id: !!user_id,
        video_id: !!video_id,
      });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    console.log('✅ Validating request data...');
    const result = await youtubeService.upsertYouTubeVideo({
      user_id,
      video_id,
      title,
    });

    if (!result) {
      res.status(500).json({ error: 'Failed to save YouTube video' });
      return;
    }

    console.log('✅ YouTube video saved successfully:', result);
    res.status(200).json({ data: result });
  } catch (err: any) {
    console.error('❌ Error in upsertYouTubeVideo:', err);
    next(err);
  }
}

// Get user's YouTube video
export async function getUserYouTubeVideo(
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'Missing required user_id parameter' });
      return;
    }

    const videoData = await youtubeService.getUserYouTubeVideo(user_id);

    if (videoData === null) {
      res.status(404).json({ error: 'No YouTube video found' });
      return;
    }

    res.status(200).json({ data: videoData });
  } catch (err: any) {
    next(err);
  }
}

// Get partner's YouTube video
export async function getPartnerYouTubeVideo(
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'Missing required user_id parameter' });
      return;
    }

    const videoData = await youtubeService.getPartnerYouTubeVideo(user_id);

    if (videoData === null) {
      res.status(404).json({ error: 'No partner YouTube video found' });
      return;
    }

    res.status(200).json({ data: videoData });
  } catch (err: any) {
    next(err);
  }
}

// Delete user's YouTube video
export async function deleteUserYouTubeVideo(
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'Missing required user_id parameter' });
      return;
    }

    const success = await youtubeService.deleteUserYouTubeVideo(user_id);

    if (!success) {
      res.status(404).json({ error: 'No YouTube video found to delete' });
      return;
    }

    res.status(200).json({ message: 'YouTube video deleted successfully' });
  } catch (err: any) {
    next(err);
  }
}
