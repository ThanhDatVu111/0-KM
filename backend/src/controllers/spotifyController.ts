import * as spotifyService from '../services/spotifyService';
import { Request, Response, NextFunction } from 'express';

// Store Spotify token
export async function storeSpotifyToken(
  req: Request<
    {},
    {},
    { user_id: string; access_token: string; refresh_token?: string; expires_at?: number }
  >,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    console.log('🔄 Received Spotify token storage request');
    console.log('📝 Request body:', req.body);

    const { user_id, access_token, refresh_token, expires_at } = req.body;

    if (!user_id || !access_token) {
      console.error('❌ Missing required fields:', {
        user_id: !!user_id,
        access_token: !!access_token,
      });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    console.log('✅ Validating request data...');
    const result = await spotifyService.storeSpotifyToken({
      user_id,
      access_token,
      refresh_token,
      expires_at,
    });

    console.log('✅ Token stored successfully:', result);
    res.status(200).json({ data: result });
  } catch (err: any) {
    console.error('❌ Error in storeSpotifyToken:', err);
    next(err);
  }
}

// Get partner's recent track
export async function getPartnerRecentTrack(
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

    const trackData = await spotifyService.getPartnerRecentTrack(user_id);

    if (trackData === null) {
      res.status(404).json({ error: 'No partner track found' });
      return;
    }

    res.status(200).json({ data: trackData });
  } catch (err: any) {
    next(err);
  }
}
