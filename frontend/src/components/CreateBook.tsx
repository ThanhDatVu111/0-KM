import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import { libraryApi } from '../apis/library';

interface CreateBookProps {
  coupleId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Calculate much smaller book size for the create modal
const screenWidth = Dimensions.get('window').width;
const modalWidth = screenWidth * 0.7; // Modal takes 70% of screen width
const previewWidth = (modalWidth - 64) / 2.5; // Make previews even smaller
const previewHeight = previewWidth * (4 / 3); // Keep the 3:4 aspect ratio

export const CreateBook: React.FC<CreateBookProps> = ({ coupleId, onSuccess, onError }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<'blue' | 'pink'>('blue');

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

      <View style={styles.colorSelector}>
        <TouchableOpacity
          style={[styles.colorOption, selectedColor === 'blue' && styles.selectedColor]}
          onPress={() => setSelectedColor('blue')}
        >
          <Image source={require('../assets/images/blue book.png')} style={styles.bookImage} />
          <Text style={styles.colorText}>Blue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.colorOption, selectedColor === 'pink' && styles.selectedColor]}
          onPress={() => setSelectedColor('pink')}
        >
          <Image source={require('../assets/images/book.png')} style={styles.bookImage} />
          <Text style={styles.colorText}>Pink</Text>
        </TouchableOpacity>
      </View>

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
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  colorOption: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
  },
  bookImage: {
    width: previewWidth,
    height: previewHeight,
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
