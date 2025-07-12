import { ApiClient } from '../apis/apiClient';
import { logger } from '../utils/logger';
import supabase from '../utils/supabase';

export interface PlaybackCommand {
  command: 'play' | 'pause' | 'next' | 'previous' | 'seek' | 'volume';
  track_uri?: string;
  position_ms?: number;
  volume?: number;
}

export interface PlaybackCommandResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Get Spotify access token from Supabase session
 */
async function getSpotifyAccessToken(): Promise<string | null> {
  try {
    // Get the current session from Supabase
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting Supabase session:', error);
      return null;
    }

    // Check if we have Spotify provider data
    const spotifyProvider = session?.user?.app_metadata?.providers?.spotify;

    if (!spotifyProvider) {
      console.log('No Spotify provider found in session');
      return null;
    }

    // Get the access token from the provider data
    const accessToken = spotifyProvider.access_token;

    if (!accessToken) {
      console.log('No access token found in Spotify provider data');
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    return null;
  }
}

/**
 * Send a playback command to the backend
 */
export async function sendPlaybackCommand(
  roomId: string,
  command: PlaybackCommand,
  userId: string,
  apiClient: ApiClient,
): Promise<PlaybackCommandResponse> {
  try {
    logger.spotify.debug('Sending playback command:', { roomId, command, userId });

    // Get the Spotify access token
    const accessToken = await getSpotifyAccessToken();

    // Prepare headers with Spotify access token if available
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['x-spotify-access-token'] = accessToken;
    }

    // Send the command to the backend
    const response = await apiClient.post(
      `/playback-commands`,
      {
        room_id: roomId,
        user_id: userId,
        command: command.command,
        track_uri: command.track_uri,
        position_ms: command.position_ms,
        volume: command.volume,
      },
      undefined, // userToken
      headers,
    );

    logger.spotify.debug('Playback command response:', response);

    return {
      success: true,
      message: 'Command sent successfully',
      data: response,
    };
  } catch (error) {
    logger.spotify.error('Error sending playback command:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send command',
    };
  }
}

/**
 * Get playback commands for a room
 */
export async function getPlaybackCommands(
  roomId: string,
  apiClient: ApiClient,
): Promise<PlaybackCommandResponse> {
  try {
    logger.spotify.debug('Getting playback commands for room:', roomId);

    const response = await apiClient.get(`/playback-commands?room_id=${roomId}`);

    return {
      success: true,
      message: 'Commands retrieved successfully',
      data: response,
    };
  } catch (error) {
    logger.spotify.error('Error getting playback commands:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get commands',
    };
  }
}

/**
 * Delete playback commands for a room
 */
export async function deletePlaybackCommands(
  roomId: string,
  apiClient: ApiClient,
): Promise<PlaybackCommandResponse> {
  try {
    logger.spotify.debug('Deleting playback commands for room:', roomId);

    const response = await apiClient.delete(`/playback-commands?room_id=${roomId}`);

    return {
      success: true,
      message: 'Commands deleted successfully',
      data: response,
    };
  } catch (error) {
    logger.spotify.error('Error deleting playback commands:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete commands',
    };
  }
}
