import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { libraryApi } from '@/apis/library';
import type { Book } from '@/types/library';
import Button from '@/components/Button';
import { BookColor, BOOK_COLORS, COLOR_OPTIONS } from '@/constants/books';

interface EditBookProps {
  book: Book;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export const EditBook: React.FC<EditBookProps> = ({ book, onSuccess, onError, onCancel }) => {
  const [title, setTitle] = useState(book.title);
  const [selectedColor, setSelectedColor] = useState<BookColor>(book.color as BookColor);

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

  return (
    <View className="p-4">
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
        placeholder="Book title"
        value={title}
        onChangeText={setTitle}
        maxLength={30}
      />

      <Text style={styles.label}>Color</Text>
      <View style={styles.colorSelector}>
        {COLOR_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.color}
            style={styles.colorOptionContainer}
            onPress={() => setSelectedColor(option.color)}
          >
            <View
              style={[
                styles.colorCircle,
                { backgroundColor: BOOK_COLORS[option.color] },
                selectedColor === option.color && styles.selectedColor,
              ]}
            />
            <Text
              style={[styles.colorText, selectedColor === option.color && styles.selectedColorText]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="flex-row justify-end gap-2 mt-4">
        <Button
          onPress={onCancel}
          label="Cancel"
          className="bg-gray-100 px-4 py-2"
          textClassName="text-gray-600"
        />
        <Button
          onPress={handleEditBook}
          label="Save Changes"
          className="bg-[#F5829B] px-4 py-2"
          textClassName="text-white"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  colorOptionContainer: {
    alignItems: 'center',
    width: '28%',
    marginBottom: 12,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
  },
  colorText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  selectedColorText: {
    color: '#333',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FF69B4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
