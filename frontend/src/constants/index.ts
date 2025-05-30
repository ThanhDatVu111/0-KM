import icons from '@/constants/icons';
import { Message, User } from 'types';

// Chat function mock values
export const sender: User = {
  userId: '1',
  email: 'a@gmail.com',
  username: 'You',
  photo_url: icons.user_icon_female,
  partnerId: '2',
};

export const recipient: User = {
  userId: '2',
  email: 'b@gmail.com',
  username: 'Your Partner',
  photo_url: icons.user_icon_female,
  partnerId: '1',
};

export const messages: Message[] = [
  {
    messageId: 3,
    content: 'I miss you too ;-;',
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
    user: recipient,
  },
  {
    messageId: 2,
    content: 'It was good! Missing you though 💕',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    user: sender,
  },
  {
    messageId: 1,
    content: 'Hey babe! How was your day? ❤️',
    createdAt: new Date(),
    user: recipient,
  },
];
