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

interface CreateBookProps {
  coupleId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type BookColor = 'blue' | 'pink' | 'green' | 'yellow' | 'purple' | 'red';

// Calculate much smaller book size for the create modal
const screenWidth = Dimensions.get('window').width;
const modalWidth = screenWidth * 0.7; // Modal takes 70% of screen width
const previewWidth = (modalWidth - 64) / 3; // Adjust for 3 books per row
const previewHeight = previewWidth * (4 / 3); // Keep the 3:4 aspect ratio

export const CreateBook: React.FC<CreateBookProps> = ({ coupleId, onSuccess, onError }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<BookColor>('blue');

  const handleCreateBook = async () => {
    try {
      console.log('📚 Attempting to create book:', {
        couple_id: coupleId,
        title: title.trim(),
        color: selectedColor,
      });

      if (!title.trim()) {
        console.log('❌ Empty title provided');
        onError?.('Please enter a title');
        return;
      }

      await libraryApi.createBook({
        couple_id: coupleId,
        title: title.trim(),
        color: selectedColor,
      });

      console.log('✅ Book created successfully');
      setTitle('');
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Error creating book:', error);
      onError?.(error.message || 'Failed to create book');
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

      <TouchableOpacity style={styles.createButton} onPress={handleCreateBook}>
        <Text style={styles.buttonText}>Create Book</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  colorScrollView: {
    maxHeight: previewHeight * 2 + 40, // Allow for 2 rows of books
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  colorOption: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    width: previewWidth,
  },
  selectedColor: {
    borderColor: '#007AFF',
  },
  bookImage: {
    width: previewWidth - 8,
    height: previewHeight - 8,
    resizeMode: 'contain',
  },
  colorText: {
    marginTop: 2,
    fontSize: 11,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
