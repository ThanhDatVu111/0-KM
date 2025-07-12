import supabase from '../../utils/supabase';

export interface PlaybackCommand {
  id: string;
  room_id: string;
  command?: 'play' | 'pause' | 'next' | 'previous' | 'seek' | 'volume';
  action?: string; // Existing column - we'll use this for backward compatibility
  track_uri?: string;
  position_ms?: number;
  volume?: number;
  requested_at?: string;
  requested_by_user_id?: string;
  created_at: string;
}

export interface CreatePlaybackCommandInput {
  room_id: string;
  command?: 'play' | 'pause' | 'next' | 'previous' | 'seek' | 'volume';
  action?: string; // For backward compatibility
  track_uri?: string;
  position_ms?: number;
  volume?: number;
  requested_at?: string;
  requested_by_user_id?: string;
}

/**
 * Create a new playback command
 */
export async function createPlaybackCommand(
  input: CreatePlaybackCommandInput,
): Promise<PlaybackCommand | null> {
  try {
    const insertData: any = {
      room_id: input.room_id,
      track_uri: input.track_uri,
    };

    // Use command if provided, otherwise use action for backward compatibility
    if (input.command) {
      insertData.command = input.command;
    } else if (input.action) {
      insertData.action = input.action;
    }

    // Add optional fields if provided
    if (input.position_ms !== undefined) {
      insertData.position_ms = input.position_ms;
    }
    if (input.volume !== undefined) {
      insertData.volume = input.volume;
    }
    if (input.requested_at) {
      insertData.requested_at = input.requested_at;
    }
    if (input.requested_by_user_id) {
      insertData.requested_by_user_id = input.requested_by_user_id;
    }

    const { data, error } = await supabase
      .from('playback_commands')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating playback command:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createPlaybackCommand:', error);
    return null;
  }
}

/**
 * Get recent playback commands for a room
 */
export async function getRecentPlaybackCommands(
  room_id: string,
  limit: number = 10,
): Promise<PlaybackCommand[]> {
  try {
    const { data, error } = await supabase
      .from('playback_commands')
      .select('*')
      .eq('room_id', room_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent playback commands:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentPlaybackCommands:', error);
    return [];
  }
}

/**
 * Clean up old playback commands (keep only last 50 per room)
 */
export async function cleanupOldPlaybackCommands(room_id: string): Promise<void> {
  try {
    // Get all commands for the room, ordered by creation time
    const { data: allCommands, error } = await supabase
      .from('playback_commands')
      .select('created_at')
      .eq('room_id', room_id)
      .order('created_at', { ascending: false });

    if (error || !allCommands || allCommands.length <= 50) {
      return; // No cleanup needed
    }

    // Get the cutoff time (50th most recent command)
    const cutoffTime = allCommands[49].created_at;

    // Delete commands older than the cutoff
    const { error: deleteError } = await supabase
      .from('playback_commands')
      .delete()
      .eq('room_id', room_id)
      .lt('created_at', cutoffTime);

    if (deleteError) {
      console.error('Error cleaning up old playback commands:', deleteError);
    }
  } catch (error) {
    console.error('Error in cleanupOldPlaybackCommands:', error);
  }
}
