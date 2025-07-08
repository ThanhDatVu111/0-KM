import React, { useState } from 'react';
import { View, Text, TextInput, Dimensions, TouchableOpacity, Image } from 'react-native';
import { libraryApi } from '@/apis/library';
import type { Book } from '@/types/library';
import { BookColor, BOOK_IMAGES } from '@/constants/books';

interface EditBookProps {
  book: Book;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const BOOK_IMAGE_OPTIONS: { color: BookColor; label: string; image: any }[] = [
  { color: 'pink', label: 'Pink', image: BOOK_IMAGES.pink },
  { color: 'purple', label: 'Purple', image: BOOK_IMAGES.purple },
  { color: 'blue', label: 'Blue', image: BOOK_IMAGES.blue },
  { color: 'darkblue', label: 'Dark Blue', image: BOOK_IMAGES.darkblue },
  { color: 'green', label: 'Green', image: BOOK_IMAGES.green },
  { color: 'white', label: 'White', image: BOOK_IMAGES.white },
];

export const EditBook: React.FC<EditBookProps> = ({ book, onSuccess, onError, onCancel }) => {
  const [title, setTitle] = useState(book.title);
  const [selectedColor, setSelectedColor] = useState<BookColor>(book.color as BookColor);
  const screenWidth = Dimensions.get('window').width;
  const modalWidth = screenWidth * 0.7;
  const itemWidth = (modalWidth - 32) / 3;
  const imageSize = itemWidth - 16;

  const handleEditBook = async () => {
    try {
      if (!title.trim()) {
        onError?.('Please enter a title');
        return;
      }

      await libraryApi.updateBook(book.id, {
        title: title.trim(),
        color: selectedColor,
      });

      onSuccess?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to update book');
    }
  };

  const rows = BOOK_IMAGE_OPTIONS.reduce(
    (acc, curr, i) => {
      const rowIndex = Math.floor(i / 3);
      if (!acc[rowIndex]) acc[rowIndex] = [];
      acc[rowIndex].push(curr);
      return acc;
    },
    [] as (typeof BOOK_IMAGE_OPTIONS)[],
  );

  return (
    <View style={{ padding: 16 }}>
      {/* Retro Input */}
      <TextInput
        value={title}
        onChangeText={setTitle}
        maxLength={30}
        placeholder="Enter book title"
        placeholderTextColor="#999"
        style={{
          borderWidth: 2,
          borderColor: '#000',
          backgroundColor: '#FFF5F8',
          padding: 10,
          fontFamily: 'PixelifySans',
          marginBottom: 16,
          fontSize: 14,
        }}
      />

      {/* Book Color Picker */}
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 12 }}
        >
          {row.map((option) => (
            <View key={option.color} style={{ alignItems: 'center' }}>
              <Image
                source={option.image}
                style={{
                  width: imageSize,
                  height: imageSize * 1.33,
                }}
                resizeMode="contain"
              />
              <TouchableOpacity
                onPress={() => setSelectedColor(option.color)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: selectedColor === option.color ? '#FCD6E7' : '#FFF',
                  borderColor: '#000',
                  borderWidth: 2,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 10,
                    color: '#000',
                    textAlign: 'center',
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}

      {/* Retro Action Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#FFF',
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderWidth: 2,
            borderColor: '#000',
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
          }}
        >
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 13,
              color: '#000',
            }}
          >
            CANCEL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleEditBook}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#ED4C90',
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderWidth: 2,
            borderColor: '#000',
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
          }}
        >
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 13,
              color: '#FAD3E4',
            }}
          >
            SAVE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
