import { supabase } from '@/apis/apiClient';

export interface SpotifySyncState {
  trackUri: string;
  position: number;
  isPlaying: boolean;
  timestamp: number;
  userId: string;
}

export interface SpotifySyncMessage {
  id: string;
  room_id: string;
  user_id: string;
  sync_data: SpotifySyncState;
  created_at: string;
}

class SpotifySyncService {
  private channels: Map<string, any> = new Map();
  private listeners: Map<string, (state: SpotifySyncState) => void> = new Map();

  // Subscribe to Spotify sync updates for a room
  subscribeToRoom(roomId: string, onSyncUpdate: (state: SpotifySyncState) => void) {
    // Store the listener
    this.listeners.set(roomId, onSyncUpdate);

    // Create Supabase realtime channel
    const channel = supabase
      .channel(`spotify-sync-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spotify_sync',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const syncMessage = payload.new as SpotifySyncMessage;
          if (syncMessage && syncMessage.sync_data) {
            onSyncUpdate(syncMessage.sync_data);
          }
        },
      )
      .subscribe();

    this.channels.set(roomId, channel);

    return () => {
      this.unsubscribeFromRoom(roomId);
    };
  }

  // Unsubscribe from a room
  unsubscribeFromRoom(roomId: string) {
    const channel = this.channels.get(roomId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(roomId);
    }

    this.listeners.delete(roomId);
  }

  // Broadcast sync state to other users in the room
  async broadcastSyncState(roomId: string, userId: string, syncState: SpotifySyncState) {
    try {
      const { error } = await supabase.from('spotify_sync').insert([
        {
          room_id: roomId,
          user_id: userId,
          sync_data: syncState,
        },
      ]);

      if (error) {
        console.error('Failed to broadcast sync state:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error broadcasting sync state:', error);
      throw error;
    }
  }

  // Get recent sync state for a room
  async getRecentSyncState(roomId: string): Promise<SpotifySyncState | null> {
    try {
      const { data, error } = await supabase
        .from('spotify_sync')
        .select('sync_data')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Failed to get recent sync state:', error);
        return null;
      }

      return data?.sync_data || null;
    } catch (error) {
      console.error('Error getting recent sync state:', error);
      return null;
    }
  }

  // Clean up old sync messages (keep only recent ones)
  async cleanupOldSyncMessages(roomId: string, keepLastMinutes: number = 5) {
    try {
      const cutoffTime = new Date(Date.now() - keepLastMinutes * 60 * 1000);

      const { error } = await supabase
        .from('spotify_sync')
        .delete()
        .eq('room_id', roomId)
        .lt('created_at', cutoffTime.toISOString());

      if (error) {
        console.error('Failed to cleanup old sync messages:', error);
      }
    } catch (error) {
      console.error('Error cleaning up old sync messages:', error);
    }
  }

  // Get all active listeners
  getActiveListeners(): string[] {
    return Array.from(this.listeners.keys());
  }

  // Disconnect all channels
  disconnectAll() {
    this.channels.forEach((channel, roomId) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.listeners.clear();
  }
}

export const spotifySyncService = new SpotifySyncService();
