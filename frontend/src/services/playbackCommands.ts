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

type PlaybackCommandType = PlaybackCommand['command'];

/**
 * Send a playback command into room relay channel.
 * This writes to Supabase `playback_commands` table, which controller clients
 * subscribe to via real-time listener.
 */
export async function sendPlaybackCommand(
  roomId: string,
  command: PlaybackCommandType,
  track_uri?: string,
  options?: {
    position_ms?: number;
    volume?: number;
    requested_by_user_id?: string;
  },
): Promise<PlaybackCommandResponse> {
  try {
    const payload = {
      room_id: roomId,
      command,
      track_uri,
      position_ms: options?.position_ms,
      volume: options?.volume,
      requested_at: new Date().toISOString(),
      requested_by_user_id: options?.requested_by_user_id,
    };

    logger.spotify.debug('Sending playback command:', payload);

    const { data, error } = await supabase
      .from('playback_commands')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    logger.spotify.debug('Playback command response:', data);

    return {
      success: true,
      message: 'Command sent successfully',
      data,
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
 * Convenience helper to send play command with a required track URI.
 */
export async function sendPlayTrackCommand(
  roomId: string,
  trackUri: string,
  requestedByUserId?: string,
): Promise<PlaybackCommandResponse> {
  return sendPlaybackCommand(roomId, 'play', trackUri, {
    position_ms: 0,
    requested_by_user_id: requestedByUserId,
  });
}

/**
 * Get playback commands for a room
 */
export async function getPlaybackCommands(
  roomId: string,
): Promise<PlaybackCommandResponse> {
  try {
    logger.spotify.debug('Getting playback commands for room:', roomId);

    const { data, error } = await supabase
      .from('playback_commands')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Commands retrieved successfully',
      data,
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
): Promise<PlaybackCommandResponse> {
  try {
    logger.spotify.debug('Deleting playback commands for room:', roomId);

    const { error } = await supabase.from('playback_commands').delete().eq('room_id', roomId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Commands deleted successfully',
      data: null,
    };
  } catch (error) {
    logger.spotify.error('Error deleting playback commands:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete commands',
    };
  }
}
