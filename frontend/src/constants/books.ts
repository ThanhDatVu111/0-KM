export type BookColor = 'pink' | 'purple' | 'blue' | 'green' | 'white' | 'darkblue';

export const BOOK_IMAGES = {
  pink: require('../assets/images/pinkBook.png'),
  purple: require('../assets/images/purpleBook.png'),
  blue: require('../assets/images/blue1Book.png'),
  darkblue: require('../assets/images/blue2Book.png'),
  green: require('../assets/images/greenBook.png'),
  white: require('../assets/images/whiteBook.png'),
} as const;