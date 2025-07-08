import { Request, Response, NextFunction } from 'express';
import {
  createRoomTrack,
  getRoomTrack,
  updateRoomTrack,
  deleteRoomTrack,
  searchSpotifyTracks as searchSpotifyTracksService,
  playSpotifyTrack as playSpotifyTrackService,
  pauseSpotifyPlayback as pauseSpotifyPlaybackService,
  skipToNextTrack as skipToNextTrackService,
  skipToPreviousTrack as skipToPreviousTrackService,
  setPlaybackVolume as setPlaybackVolumeService,
  getSpotifyAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  CreateRoomSpotifyTrackRequest,
  UpdateRoomSpotifyTrackRequest,
} from '../services/spotifyService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get Spotify authorization URL
 */
export async function getAuthUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authUrl = getSpotifyAuthUrl();
    res.json({ auth_url: authUrl });
  } catch (error: any) {
    console.error('Error in getAuthUrl controller:', error);
    next(error);
  }
}

/**
 * Handle Spotify OAuth callback
 */
export async function handleAuthCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    const tokenData = await exchangeCodeForToken(code);
    res.json(tokenData);
  } catch (error: any) {
    console.error('Error in handleAuthCallback controller:', error);
    next(error);
  }
}

/**
 * Refresh Spotify access token
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const tokenData = await refreshAccessToken(refresh_token);
    res.json(tokenData);
  } catch (error: any) {
    console.error('Error in refreshToken controller:', error);
    next(error);
  }
}

/**
 * Create a new room Spotify track
 */
export async function createRoomSpotifyTrack(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      user_id,
      track_id,
      track_name,
      artist_name,
      album_name,
      album_art_url,
      duration_ms,
      track_uri,
    } = req.body;

    if (
      !track_id ||
      !track_name ||
      !artist_name ||
      !album_name ||
      !album_art_url ||
      !duration_ms ||
      !track_uri
    ) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const request: CreateRoomSpotifyTrackRequest = {
      user_id: user_id || '', // Fallback for backward compatibility
      track_id,
      track_name,
      artist_name,
      album_name,
      album_art_url,
      duration_ms,
      track_uri,
    };

    const track = await createRoomTrack(req, request);

    if (!track) {
      res.status(500).json({ error: 'Failed to create room track' });
      return;
    }

    res.status(201).json(track);
  } catch (error: any) {
    console.error('Error in createRoomSpotifyTrack controller:', error);

    if (error.message === 'User is not in a room') {
      res.status(400).json({ error: 'User must be in a room to add tracks' });
      return;
    }

    if (error.message === 'User not authenticated') {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    next(error);
  }
}

/**
 * Get the current room Spotify track
 */
export async function getRoomSpotifyTrack(
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

    const track = await getRoomTrack(user_id);

    if (!track) {
      res.status(404).json({ error: 'No track found in room' });
      return;
    }

    res.status(200).json(track);
  } catch (error: any) {
    console.error('Error in getRoomSpotifyTrack controller:', error);
    next(error);
  }
}

/**
 * Update room Spotify track
 */
export async function updateRoomSpotifyTrack(
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;
    const updateData = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    const request: UpdateRoomSpotifyTrackRequest = {
      id: '', // Will be set in service
      ...updateData,
    };

    const track = await updateRoomTrack(user_id, request);

    if (!track) {
      res.status(404).json({ error: 'Failed to update room track' });
      return;
    }

    res.status(200).json(track);
  } catch (error: any) {
    console.error('Error in updateRoomSpotifyTrack controller:', error);
    next(error);
  }
}

/**
 * Delete room Spotify track
 */
export async function deleteRoomSpotifyTrack(
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

    const success = await deleteRoomTrack(user_id);

    if (!success) {
      res.status(404).json({ error: 'Failed to delete room track' });
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error in deleteRoomSpotifyTrack controller:', error);
    next(error);
  }
}

/**
 * Search Spotify tracks
 */
export async function searchSpotifyTracks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const tracks = await searchSpotifyTracksService(q);
    res.status(200).json(tracks);
  } catch (error: any) {
    console.error('Error in searchSpotifyTracks controller:', error);
    next(error);
  }
}

/**
 * Play Spotify track
 */
export async function playSpotifyTrack(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    console.log('🎵 [DEBUG] /spotify/play called with body:', req.body);
    const { user_id, track_uri } = req.body;

    console.log('🎵 [Controller] /spotify/play called', { user_id, track_uri });

    if (!user_id || !track_uri) {
      res.status(400).json({ error: 'user_id and track_uri are required' });
      return;
    }

    await playSpotifyTrackService(user_id, track_uri);
    console.log('🎵 [Controller] Playback started successfully');
    res.status(200).json({ message: 'Playback started' });
  } catch (error: any) {
    console.error('❌ [DEBUG] Error in playSpotifyTrack controller:', error);
    next(error);
  }
}

/**
 * Pause Spotify playback
 */
export async function pauseSpotifyPlayback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    await pauseSpotifyPlaybackService(user_id);
    res.status(200).json({ message: 'Playback paused' });
  } catch (error: any) {
    console.error('Error in pauseSpotifyPlayback controller:', error);
    next(error);
  }
}

/**
 * Skip to next track
 */
export async function skipToNextTrack(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    await skipToNextTrackService(user_id);
    res.status(200).json({ message: 'Skipped to next track' });
  } catch (error: any) {
    console.error('Error in skipToNextTrack controller:', error);
    next(error);
  }
}

/**
 * Skip to previous track
 */
export async function skipToPreviousTrack(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    await skipToPreviousTrackService(user_id);
    res.status(200).json({ message: 'Skipped to previous track' });
  } catch (error: any) {
    console.error('Error in skipToPreviousTrack controller:', error);
    next(error);
  }
}

/**
 * Set playback volume
 */
export async function setPlaybackVolume(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id, volume } = req.body;

    if (!user_id || typeof volume !== 'number') {
      res.status(400).json({ error: 'user_id and volume (number) are required' });
      return;
    }

    if (volume < 0 || volume > 100) {
      res.status(400).json({ error: 'Volume must be between 0 and 100' });
      return;
    }

    await setPlaybackVolumeService(user_id, volume);
    res.status(200).json({ message: 'Volume set' });
  } catch (error: any) {
    console.error('Error in setPlaybackVolume controller:', error);
    next(error);
  }
}
