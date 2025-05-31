import { ImageSourcePropType } from 'react-native';

export type User = {
  userId: string;
  email: string;
  username?: string;
  birthdate?: Date;
  photo_url?: ImageSourcePropType;
  partnerId: string;
};

export type Message = {
  messageId: number;
  content: string;
  createdAt: Date;
  user: User;
  isDelivered?: boolean;
  isRead?: boolean;
  reactions?: {
    emoji: string;
    userId: string;
  }[];
};

// interface GetRoom {}
// interface GetMessages {}
