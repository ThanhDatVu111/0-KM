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

type BookColor = 'blue' | 'pink' | 'green' | 'yellow' | 'purple' | 'red';

interface CreateBookProps {
  coupleId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

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

      <TouchableOpacity style={styles.button} onPress={handleCreateBook}>
        <Text style={styles.buttonText}>Create Book</Text>
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
  colorScrollView: {
    maxHeight: 200,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  colorOption: {
    width: previewWidth,
    marginBottom: 16,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  selectedColor: {
    backgroundColor: '#f0f0f0',
  },
  bookImage: {
    width: previewWidth - 16,
    height: previewHeight - 16,
    resizeMode: 'contain',
  },
  colorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
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
