export type BookColor = 'blue' | 'pink' | 'green' | 'yellow' | 'purple' | 'red';

export const BOOK_COLORS: Record<BookColor, string> = {
  blue: '#4A90E2',
  pink: '#FF69B4',
  green: '#50C878',
  yellow: '#FFD700',
  purple: '#9370DB',
  red: '#FF6B6B',
};

export const BOOK_IMAGES = {
  blue: require('../assets/images/blue book.png'),
  pink: require('../assets/images/book.png'),
  green: require('../assets/images/green book.png'),
  yellow: require('../assets/images/yellow book.png'),
  purple: require('../assets/images/purple book.png'),
  red: require('../assets/images/red book.png'),
} as const;

export const COLOR_OPTIONS = [
  { color: 'blue' as BookColor, label: 'Blue', image: BOOK_IMAGES.blue },
  { color: 'pink' as BookColor, label: 'Pink', image: BOOK_IMAGES.pink },
  { color: 'green' as BookColor, label: 'Green', image: BOOK_IMAGES.green },
  { color: 'yellow' as BookColor, label: 'Yellow', image: BOOK_IMAGES.yellow },
  { color: 'purple' as BookColor, label: 'Purple', image: BOOK_IMAGES.purple },
  { color: 'red' as BookColor, label: 'Red', image: BOOK_IMAGES.red },
];
