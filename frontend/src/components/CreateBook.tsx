import React, { useState } from 'react';
import { View, TextInput, Image, Dimensions, TouchableOpacity, Text } from 'react-native';
import { libraryApi } from '../apis/library';
import { BookColor, BOOK_IMAGES } from '@/constants/books';

interface CreateBookProps {
  coupleId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const BOOK_IMAGE_OPTIONS: { color: BookColor; label: string; image: any }[] = [
  { color: 'pink', label: 'Pink', image: BOOK_IMAGES.pink },
  { color: 'purple', label: 'Purple', image: BOOK_IMAGES.purple },
];

export const CreateBook: React.FC<CreateBookProps> = ({ coupleId, onSuccess, onError }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<BookColor>('pink');
  const screenWidth = Dimensions.get('window').width;
  const modalWidth = screenWidth * 0.7;
  const itemWidth = (modalWidth - 32) / 3;
  const imageSize = itemWidth - 16;

  const handleCreateBook = async () => {
    if (!title.trim()) return onError?.('Please enter a title');
    try {
      await libraryApi.createBook({
        couple_id: coupleId,
        title: title.trim(),
        color: selectedColor,
      });
      setTitle('');
      onSuccess?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to create book');
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
      <View style={{ marginBottom: 16 }}>
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}
          >
            {row.map((option) => (
              <View key={option.color} style={{ width: itemWidth, alignItems: 'center' }}>
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
                    marginTop: 8,
                    backgroundColor: selectedColor === option.color ? '#FCD6E7' : '#FFF',
                    borderColor: '#000',
                    borderWidth: 2,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'PixelifySans',
                      fontSize: 10,
                      color: '#000',
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Retro Create Button */}
      <TouchableOpacity
        onPress={handleCreateBook}
        activeOpacity={0.8}
        style={{
          alignSelf: 'center',
          backgroundColor: '#FAD3E4',
          paddingHorizontal: 24,
          paddingVertical: 10,
          borderColor: '#000',
          borderWidth: 3,
          shadowColor: '#000',
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 1,
        }}
      >
        <Text
          style={{
            fontFamily: 'PixelifySans',
            fontSize: 14,
            
          }}
        >
          CREATE BOOK
        </Text>
      </TouchableOpacity>
    </View>
  );
};