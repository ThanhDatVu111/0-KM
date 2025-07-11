import { Request, Response } from 'express';
import * as spotifyService from '../services/spotifyService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

// Create room Spotify track
export async function createRoomTrack(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const request = req.body as spotifyService.CreateRoomSpotifyTrackRequest;
    const accessToken = req.headers['x-spotify-access-token'] as string;

    logger.spotify.info('Creating room Spotify track:', {
      userId: req.user?.id,
      trackName: request.track_name,
      artistName: request.artist_name,
    });

    const track = await spotifyService.createRoomTrack(req, request);

    if (track) {
      // If we have an access token, try to play the track
      if (accessToken && request.track_uri) {
        try {
          await spotifyService.playSpotifyTrack(req.user?.id || '', request.track_uri, accessToken);
          logger.spotify.info('Track started playing automatically');
        } catch (playError) {
          logger.spotify.warn('Failed to auto-play track:', playError);
          // Don't fail the request if auto-play fails
        }
      }

      res.status(201).json({
        success: true,
        data: track,
        message: 'Room Spotify track created successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to create room Spotify track',
      });
    }
  } catch (error) {
    logger.spotify.error('Error in createRoomTrack controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Get room Spotify track
export async function getRoomTrack(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    logger.spotify.debug('Getting room Spotify track for user:', userId);

    const track = await spotifyService.getRoomTrack(userId);

    // Always return 200, even if no track is found
    res.status(200).json({
      success: true,
      data: track,
      message: track ? 'Room Spotify track retrieved successfully' : 'No track found in room',
    });
  } catch (error) {
    logger.spotify.error('Error in getRoomTrack controller:', error);
    // Even if there's an error, return 200 with null data instead of 500
    res.status(200).json({
      success: true,
      data: null,
      message: 'No track found in room',
    });
  }
}

// Update room Spotify track
export async function updateRoomTrack(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const request = req.body as spotifyService.UpdateRoomSpotifyTrackRequest;

    logger.spotify.info('Updating room Spotify track:', {
      userId,
      trackId: request.id,
    });

    const track = await spotifyService.updateRoomTrack(userId, request);

    if (track) {
      res.status(200).json({
        success: true,
        data: track,
        message: 'Room Spotify track updated successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Track not found or update failed',
      });
    }
  } catch (error) {
    logger.spotify.error('Error in updateRoomTrack controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Delete room Spotify track
export async function deleteRoomTrack(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    logger.spotify.info('Deleting room Spotify track for user:', userId);
    console.log('🎵 [DEBUG] Delete request received for user:', userId);

    const success = await spotifyService.deleteRoomTrack(userId);
    console.log('🎵 [DEBUG] Delete service result:', success);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Room Spotify track deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Track not found or delete failed',
      });
    }
  } catch (error) {
    logger.spotify.error('Error in deleteRoomTrack controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Delete room Spotify track by room ID
export async function deleteRoomTrackByRoomId(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const roomId = req.params.room_id;
    if (!roomId) {
      res.status(400).json({
        success: false,
        message: 'Room ID is required',
      });
      return;
    }

    logger.spotify.info('Deleting room Spotify track for room:', roomId);

    const success = await spotifyService.deleteRoomTrackByRoomId(roomId);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Room Spotify track deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Track not found or delete failed',
      });
    }
  } catch (error) {
    logger.spotify.error('Error in deleteRoomTrackByRoomId controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Search Spotify tracks
export async function searchTracks(req: Request, res: Response): Promise<void> {
  try {
    console.log('🔍 [DEBUG] Search request received');
    console.log('🔍 [DEBUG] Request URL:', req.url);
    console.log('🔍 [DEBUG] Request query:', req.query);
    console.log('🔍 [DEBUG] Request params:', req.params);

    const { q } = req.query; // Changed from 'query' to 'q' to match frontend

    console.log('🔍 [DEBUG] Extracted query parameter:', q);
    console.log('🔍 [DEBUG] Query type:', typeof q);
    console.log('🔍 [DEBUG] Query truthy check:', !!q);

    if (!q || typeof q !== 'string') {
      console.log('❌ [DEBUG] Query validation failed');
      res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
      return;
    }

    console.log('🔍 [DEBUG] Query validation passed, searching for:', q);
    logger.spotify.debug('Searching Spotify tracks with query:', q);

    const tracks = await spotifyService.searchSpotifyTracks(q);

    res.status(200).json({
      success: true,
      data: tracks,
      message: `Found ${tracks.length} tracks`,
    });
  } catch (error) {
    logger.spotify.error('Error in searchTracks controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Get Spotify authorization URL
export async function getAuthUrl(req: Request, res: Response): Promise<void> {
  try {
    const authUrl = spotifyService.getSpotifyAuthUrl();

    res.status(200).json({
      success: true,
      data: { authUrl },
      message: 'Spotify authorization URL generated successfully',
    });
  } catch (error) {
    logger.spotify.error('Error in getAuthUrl controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
      return;
    }

    logger.spotify.debug('Exchanging authorization code for access token');

    const tokenData = await spotifyService.exchangeCodeForToken(code);

    res.status(200).json({
      success: true,
      data: tokenData,
      message: 'Access token obtained successfully',
    });
  } catch (error) {
    logger.spotify.error('Error in exchangeCodeForToken controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Play Spotify track
export async function playTrack(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { track_uri } = req.body;
    const accessToken = req.headers['x-spotify-access-token'] as string;

    if (!track_uri) {
      res.status(400).json({
        success: false,
        message: 'Track URI is required',
      });
      return;
    }

    logger.spotify.info('Playing Spotify track:', { userId, track_uri });

    await spotifyService.playSpotifyTrack(userId, track_uri, accessToken);

    res.status(200).json({
      success: true,
      message: 'Track started playing successfully',
    });
  } catch (error) {
    logger.spotify.error('Error in playTrack controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Pause Spotify playback
export async function pausePlayback(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const accessToken = req.headers['x-spotify-access-token'] as string;

    logger.spotify.info('Pausing Spotify playback for user:', userId);

    await spotifyService.pauseSpotifyPlayback(userId, accessToken);

    res.status(200).json({
      success: true,
      message: 'Playback paused successfully',
    });
  } catch (error) {
    logger.spotify.error('Error in pausePlayback controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Skip to next track
export async function skipToNext(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const accessToken = req.headers['x-spotify-access-token'] as string;

    logger.spotify.info('Skipping to next track for user:', userId);

    await spotifyService.skipToNextTrack(userId, accessToken);

    res.status(200).json({
      success: true,
      message: 'Skipped to next track successfully',
    });
  } catch (error) {
    logger.spotify.error('Error in skipToNext controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Skip to previous track
export async function skipToPrevious(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const accessToken = req.headers['x-spotify-access-token'] as string;

    logger.spotify.info('Skipping to previous track for user:', userId);

    await spotifyService.skipToPreviousTrack(userId, accessToken);

    res.status(200).json({
      success: true,
      message: 'Skipped to previous track successfully',
    });
  } catch (error) {
    logger.spotify.error('Error in skipToPrevious controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Set playback volume
export async function setVolume(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { volume } = req.body;
    const accessToken = req.headers['x-spotify-access-token'] as string;

    if (typeof volume !== 'number' || volume < 0 || volume > 100) {
      res.status(400).json({
        success: false,
        message: 'Volume must be a number between 0 and 100',
      });
      return;
    }

    logger.spotify.info('Setting playback volume for user:', { userId, volume });

    await spotifyService.setPlaybackVolume(userId, volume, accessToken);

    res.status(200).json({
      success: true,
      message: 'Volume set successfully',
    });
  } catch (error) {
    logger.spotify.error('Error in setVolume controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
