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

// Calculate consistent book size
const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - 48) / 3; // Same calculation as in Library screen
const cardHeight = cardWidth * (4 / 3); // Using the same 3:4 aspect ratio

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
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  colorOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
  },
  bookImage: {
    width: cardWidth,
    height: cardHeight,
    resizeMode: 'contain',
  },
  colorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
