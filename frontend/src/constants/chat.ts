import icons from '@/constants/icons';
import { Message } from '@/types/chat';
import { User } from '@/types/users';

// Chat function mock values
export const sender: User = {
  user_id: '1',
  email: 'a@gmail.com',
  username: 'You',
  photo_url: icons.user_icon_female,
  created_at: '',
};

export const recipient: User = {
  user_id: '2',
  email: 'b@gmail.com',
  username: 'Your Partner',
  photo_url: icons.user_icon_female,
  created_at: '',
};

export const messages: Message[] = [
  {
    message_id: '3',
    content: 'I miss you too ;-;',
    created_at: '2025-05-30T12:10:00.000Z',
    sender_id: recipient.user_id,
    sender_photo_url: icons.user_icon_female,
  },
  {
    message_id: '2',
    content: 'It was good! Missing you though 💕',
    created_at: '2025-05-30T12:05:00.000Z',
    sender_id: sender.user_id,
    sender_photo_url: icons.user_icon_female,
  },
  {
    message_id: '1',
    content: 'Hey babe! How was your day? ❤️',
    created_at: '2025-05-30T12:00:00.000Z',
    sender_id: recipient.user_id,
    sender_photo_url: icons.user_icon_female,
  },
];
