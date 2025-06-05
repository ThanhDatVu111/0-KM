import React, { useState } from 'react';
import { View, TextInput, Image, ScrollView, Dimensions } from 'react-native';
import { libraryApi } from '../apis/library';
import Button from '@/components/Button';
import { BookColor, COLOR_OPTIONS } from '@/constants/books';

interface CreateBookProps {
  coupleId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const CreateBook: React.FC<CreateBookProps> = ({ coupleId, onSuccess, onError }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<BookColor>('blue');
  const screenWidth = Dimensions.get('window').width;
  const modalWidth = screenWidth * 0.7; // Modal takes 70% of screen width
  const itemWidth = (modalWidth - 32) / 3; // 3 items per row, 16px total gap
  const imageSize = itemWidth - 16; // Padding on both sides

  const handleCreateBook = async () => {
    try {
      if (!title.trim()) {
        onError?.('Please enter a title');
        return;
      }

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

  // Group COLOR_OPTIONS into rows of 3
  const rows = COLOR_OPTIONS.reduce(
    (acc, curr, i) => {
      const rowIndex = Math.floor(i / 3);
      if (!acc[rowIndex]) {
        acc[rowIndex] = [];
      }
      acc[rowIndex].push(curr);
      return acc;
    },
    [] as (typeof COLOR_OPTIONS)[],
  );

  return (
    <View className="p-4">
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
        placeholder="Book title"
        value={title}
        onChangeText={setTitle}
        maxLength={30}
      />

      <View className="mb-4">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-between mb-4">
            {row.map((option) => (
              <View key={option.color} style={{ width: itemWidth }} className="items-center">
                <Image
                  source={option.image}
                  style={{ width: imageSize, height: imageSize * 1.33 }}
                  resizeMode="contain"
                />
                <Button
                  onPress={() => setSelectedColor(option.color)}
                  className={`w-full px-2 py-1 mt-1 rounded ${selectedColor === option.color ? 'bg-gray-100' : ''}`}
                  label={option.label}
                  textClassName="text-xs text-gray-600"
                />
              </View>
            ))}
          </View>
        ))}
      </View>

      <Button
        onPress={handleCreateBook}
        label="Create Book"
        className="bg-[#F5829B] px-6 py-3"
        textClassName="text-white font-semibold"
      />
    </View>
  );
};
