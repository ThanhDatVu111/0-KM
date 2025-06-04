import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { libraryApi } from '../apis/library';
import type { Book } from '../types/library';

interface EditBookProps {
  book: Book;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

type BookColor = 'blue' | 'pink' | 'green' | 'yellow' | 'purple' | 'red';

const colorMap: Record<BookColor, string> = {
  blue: '#4A90E2',
  pink: '#FF69B4',
  green: '#50C878',
  yellow: '#FFD700',
  purple: '#9370DB',
  red: '#FF6B6B',
};

export const EditBook: React.FC<EditBookProps> = ({ book, onSuccess, onError }) => {
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

  const colorOptions: { color: BookColor; label: string }[] = [
    { color: 'blue', label: 'Blue' },
    { color: 'pink', label: 'Pink' },
    { color: 'green', label: 'Green' },
    { color: 'yellow', label: 'Yellow' },
    { color: 'purple', label: 'Purple' },
    { color: 'red', label: 'Red' },
  ];

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter book title"
        placeholderTextColor="#666"
        maxLength={30}
      />

      <Text style={styles.label}>Color</Text>
      <View style={styles.colorSelector}>
        {colorOptions.map((option) => (
          <TouchableOpacity
            key={option.color}
            style={styles.colorOptionContainer}
            onPress={() => setSelectedColor(option.color)}
          >
            <View
              style={[
                styles.colorCircle,
                { backgroundColor: colorMap[option.color] },
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

      <TouchableOpacity style={styles.button} onPress={handleEditBook}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
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
    marginBottom: 12,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  colorOptionContainer: {
    alignItems: 'center',
    width: '28%', // Slightly less than 1/3 to account for gap
    marginBottom: 8,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
