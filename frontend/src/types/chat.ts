export interface Message {
  message_id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_photo_url?: string; // Avatar of sender
  media_url?: string; // If the message content any images, media
  is_sent?: boolean; // Default to false
  is_read?: boolean; // Default to false
  is_edited?: boolean; // Default to false
  reaction?: string; // Default to null
}

export interface FetchMessages {
  room_id: string;
}

export interface GetMessageById {
  message_id: string;
}

export interface SendMessage {
  message_id: string;
  room_id: string;
  content: string;
  sender_id: string;
  created_at: string; // Default to now
  is_sent: boolean;
}

export interface EditMessage {
  message_id: string;
  content: string;
  is_edited: true;
}

export interface DeleteMessage {
  message_id: string;
}

// To be implemented
export interface ReactToMessage {
  message_id: string;
  reaction: string;
}
