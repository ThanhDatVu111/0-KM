import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BOOK_IMAGES, BookColor } from '@/constants/books';
import type { Book } from '@/types/library';

interface BookCardProps {
  isNew?: boolean;
  book?: Book;
  cardWidth: number;
  onCreatePress?: () => void;
  onEditPress?: (book: Book) => void;
  onDeletePress?: (book: Book) => void;
  isDropdownVisible?: boolean;
  onToggleDropdown?: () => void;
  onPress?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  isNew,
  book,
  cardWidth,
  onCreatePress,
  onEditPress,
  onDeletePress,
  isDropdownVisible,
  onToggleDropdown,
  onPress,
}) => {
  const getBookImage = (color?: string) => {
    return BOOK_IMAGES[color as BookColor] || BOOK_IMAGES.pink;
  };

  if (isNew) {
    return (
      <View style={{ width: cardWidth }} className="mb-4">
        <TouchableOpacity
          className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
          onPress={onCreatePress}
        >
          <View className="w-16 h-16 rounded-full bg-pink-100 items-center justify-center">
            <Text className="text-3xl text-pink-500">+</Text>
          </View>
          <Text className="mt-2 text-gray-500 text-lg">new</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!book) return null;

  return (
    <View style={{ width: cardWidth }} className="mb-4">
      <TouchableOpacity onPress={onPress}>
        <Image
          source={getBookImage(book.color)}
          style={{
            width: cardWidth,
            height: cardWidth * (4 / 3),
            resizeMode: 'contain',
          }}
        />
      </TouchableOpacity>
      <View className="bg-white mt-1" style={{ position: 'relative', zIndex: 1 }}>
        <View className="flex-row justify-between items-start pr-0">
          <Text
            className="flex-1 text-sm font-medium text-gray-800 px-1"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {book.title}
          </Text>
          <View className="relative" style={{ zIndex: 50 }}>
            <TouchableOpacity onPress={onToggleDropdown} className="p-1 -mr-1">
              <MaterialCommunityIcons name="dots-vertical" size={18} color="#666" />
            </TouchableOpacity>
            {isDropdownVisible && (
              <View
                className="absolute right-0 top-8 bg-white rounded-lg shadow-lg w-24 py-1 border border-gray-200"
                style={{ zIndex: 999 }}
              >
                <TouchableOpacity
                  onPress={() => onEditPress?.(book)}
                  className="flex-row items-center px-3 py-2"
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#666" />
                  <Text className="ml-2 text-sm text-gray-600">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDeletePress?.(book)}
                  className="flex-row items-center px-3 py-2"
                >
                  <MaterialCommunityIcons name="delete" size={16} color="#FF4444" />
                  <Text className="ml-2 text-sm text-red-500">Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <Text className="text-xs text-gray-600 mt-0.5 px-1">
          {new Date(book.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};
