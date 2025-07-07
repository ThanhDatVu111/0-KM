import { Request, Response, NextFunction } from 'express';
import {
  createRoomTrack,
  getRoomTrack,
  updateRoomTrack,
  deleteRoomTrack,
  searchSpotifyTracks,
  playSpotifyTrack,
  pauseSpotifyPlayback,
  skipToNextTrack,
  skipToPreviousTrack,
  setPlaybackVolume,
  CreateRoomSpotifyTrackRequest,
  UpdateRoomSpotifyTrackRequest,
} from '../services/spotifyService';
import { AuthenticatedRequest } from '../middleware/auth';

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
  req: Request<{ user_id: string }, {}, UpdateRoomSpotifyTrackRequest>,
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
      ...updateData,
    };

    const track = await updateRoomTrack(user_id, request);

    if (!track) {
      res.status(404).json({ error: 'No track found in room' });
      return;
    }

    res.status(200).json(track);
  } catch (error: any) {
    console.error('Error in updateRoomSpotifyTrack controller:', error);

    if (error.message === 'User is not in a room') {
      res.status(400).json({ error: 'User must be in a room to update tracks' });
      return;
    }

    if (error.message === 'No track found in room') {
      res.status(404).json({ error: 'No track found in room' });
      return;
    }

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
      res.status(404).json({ error: 'No track found in room' });
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error in deleteRoomSpotifyTrack controller:', error);

    if (error.message === 'User is not in a room') {
      res.status(400).json({ error: 'User must be in a room to delete tracks' });
      return;
    }

    if (error.message === 'No track found in room') {
      res.status(404).json({ error: 'No track found in room' });
      return;
    }

    next(error);
  }
}

/**
 * Search Spotify tracks
 */
export async function searchSpotifyTracksController(
  req: Request<{}, {}, {}, { q: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { q } = req.query;

    if (!q) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const tracks = await searchSpotifyTracks(q);
    res.status(200).json(tracks);
  } catch (error: any) {
    console.error('Error in searchSpotifyTracksController:', error);
    next(error);
  }
}

/**
 * Play Spotify track
 */
export async function playSpotifyTrackController(
  req: Request<{}, {}, { user_id: string; track_uri: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id, track_uri } = req.body;

    if (!user_id || !track_uri) {
      res.status(400).json({ error: 'user_id and track_uri are required' });
      return;
    }

    await playSpotifyTrack(user_id, track_uri);
    res.status(200).json({ message: 'Playback started' });
  } catch (error: any) {
    console.error('Error in playSpotifyTrackController:', error);
    next(error);
  }
}

/**
 * Pause Spotify playback
 */
export async function pauseSpotifyPlaybackController(
  req: Request<{}, {}, { user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    await pauseSpotifyPlayback(user_id);
    res.status(200).json({ message: 'Playback paused' });
  } catch (error: any) {
    console.error('Error in pauseSpotifyPlaybackController:', error);
    next(error);
  }
}

/**
 * Skip to next track
 */
export async function skipToNextTrackController(
  req: Request<{}, {}, { user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    await skipToNextTrack(user_id);
    res.status(200).json({ message: 'Skipped to next track' });
  } catch (error: any) {
    console.error('Error in skipToNextTrackController:', error);
    next(error);
  }
}

/**
 * Skip to previous track
 */
export async function skipToPreviousTrackController(
  req: Request<{}, {}, { user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    await skipToPreviousTrack(user_id);
    res.status(200).json({ message: 'Skipped to previous track' });
  } catch (error: any) {
    console.error('Error in skipToPreviousTrackController:', error);
    next(error);
  }
}

/**
 * Set playback volume
 */
export async function setPlaybackVolumeController(
  req: Request<{}, {}, { user_id: string; volume: number }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id, volume } = req.body;

    if (!user_id || volume === undefined) {
      res.status(400).json({ error: 'user_id and volume are required' });
      return;
    }

    if (volume < 0 || volume > 100) {
      res.status(400).json({ error: 'Volume must be between 0 and 100' });
      return;
    }

    await setPlaybackVolume(user_id, volume);
    res.status(200).json({ message: 'Volume set' });
  } catch (error: any) {
    console.error('Error in setPlaybackVolumeController:', error);
    next(error);
  }
}
