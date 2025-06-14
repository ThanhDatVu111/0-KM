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
      <View style={{ width: cardWidth }} className="">
        <TouchableOpacity
          className="aspect-[3/4] border-2 border-dashed border-black-300 rounded-lg items-center justify-center mt-5"
          onPress={onCreatePress}
        >
          <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
            <Text className="text-3xl text-accent">+</Text>
          </View>
          <Text className="mt-2 text-gray-500 text-lg">Create</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!book) return null;

  return (
    <View style={{ width: cardWidth }} className= "mt-5">
      <TouchableOpacity
        onPress={onPress}
        onLongPress={() => onToggleDropdown?.()}
        delayLongPress={1000}
        className="rounded-lg"
      >
        <Image
          source={getBookImage(book.color)}
          style={{
            width: cardWidth,
            height: cardWidth,
            resizeMode: 'contain',
          }}
        />
      </TouchableOpacity>
      <View className="bg-white mt-1" style={{ position: 'relative', zIndex: 1 }}>
        <View className="flex-row justify-between items-start pr-0">
          <Text
            className="flex-1 text-sm font-medium text-gray-800 px-1 text-center"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {book.title}
          </Text>

          {isDropdownVisible && (
            <View
              className="absolute right-1 top-[-4] bg-white rounded-lg shadow-lg w-24 py-1 border border-gray-200 z-50"
              style={{ right: 17, top: -35 }}
            >
              <TouchableOpacity
                onPress={() => onEditPress?.(book)}
                className="flex-row items-center px-3 py-2"
              >
                <MaterialCommunityIcons name="pencil" size={16} color="#666" />
                <Text className="ml-2 text-sm text-gray-600">Edit</Text>
              </TouchableOpacity>

              <View className="h-0.5 bg-gray-200" />

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
        <Text className="text-xs text-gray-600 mt-0.5 px-1 text-center">
          {new Date(book.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};
