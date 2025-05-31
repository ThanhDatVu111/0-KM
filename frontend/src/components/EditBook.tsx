import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  Dimensions,
  ScrollView,
} from 'react-native';
import { libraryApi } from '../apis/library';
import type { Book } from '../types/library';

interface EditBookProps {
  book: Book;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

type BookColor = 'blue' | 'pink' | 'green' | 'yellow' | 'purple' | 'red';

// Calculate much smaller book size for the edit modal
const screenWidth = Dimensions.get('window').width;
const modalWidth = screenWidth * 0.6; // Modal takes 60% of screen width
const previewWidth = (modalWidth - 32) / 2; // Show 2 books per row with less padding
const previewHeight = previewWidth * (3 / 4); // Make books shorter

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

  const handleDeleteBook = async () => {
    try {
      await libraryApi.deleteBook(book.id);
      onSuccess?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to delete book');
    }
  };

  const colorOptions: { color: BookColor; label: string; image: any }[] = [
    { color: 'blue', label: 'Blue', image: require('../assets/images/blue book.png') },
    { color: 'pink', label: 'Pink', image: require('../assets/images/book.png') },
    { color: 'green', label: 'Green', image: require('../assets/images/green book.png') },
    { color: 'yellow', label: 'Yellow', image: require('../assets/images/yellow book.png') },
    { color: 'purple', label: 'Purple', image: require('../assets/images/purple book.png') },
    { color: 'red', label: 'Red', image: require('../assets/images/red book.png') },
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

      <ScrollView style={styles.colorScrollView}>
        <View style={styles.colorSelector}>
          {colorOptions.map((option) => (
            <TouchableOpacity
              key={option.color}
              style={[styles.colorOption, selectedColor === option.color && styles.selectedColor]}
              onPress={() => setSelectedColor(option.color)}
            >
              <Image source={option.image} style={styles.bookImage} />
              <Text style={styles.colorText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteBook}>
          <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleEditBook}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 4,
    marginBottom: 6,
    fontSize: 12,
  },
  colorScrollView: {
    maxHeight: previewHeight * 2 + 24, // Show only 2 rows of books
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 6,
    rowGap: 3,
    marginBottom: 6,
    paddingHorizontal: 0,
  },
  colorOption: {
    alignItems: 'center',
    padding: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    width: previewWidth - 2,
  },
  selectedColor: {
    borderColor: '#F5829B',
  },
  bookImage: {
    width: previewWidth - 4,
    height: previewHeight - 4,
    resizeMode: 'contain',
  },
  colorText: {
    marginTop: 1,
    fontSize: 9,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  button: {
    flex: 1,
    backgroundColor: '#F5829B',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#dc2626',
  },
  cancelButton: {
    padding: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 11,
  },
});
