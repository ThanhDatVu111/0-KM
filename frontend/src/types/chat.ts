export interface Message {
  message_id: string;
  content?: string | null;
  created_at: string;
  sender_id: string;
  sender_photo_url?: string; // Avatar of sender
  media_paths?: string[]; // Include media paths
  is_voice?: boolean;
  is_sent?: boolean; // Default to false
  is_read?: boolean; // Default to false
  is_edited?: boolean; // Default to false
  reaction?: string; // Default to null
}

export interface Socket {
  room_id: string;
  user_id: string;
}

export interface FetchMessages {
  room_id: string;
}

export interface GetMessageById {
  message_id: string;
}

export interface SendMessage {
  room_id: string;
  message_id: string;
  content?: string | null;
  sender_id: string;
  created_at: string; // Default to now
  sender_photo_url?: string;
  is_sent: boolean;
  is_read?: boolean;
  is_edited?: boolean;
  reaction?: string;
  media_paths?: string[];
}

export interface EditMessage {
  message_id: string;
  content: string;
  room_id: string;
}

export interface DeleteMessage {
  message_id: string;
}

// To be implemented
export interface ReactToMessage {
  message_id: string;
  reaction: string;
}
