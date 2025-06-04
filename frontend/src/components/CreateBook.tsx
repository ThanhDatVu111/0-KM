import React, { useState } from 'react';
import {
  View,
  TextInput,
  Image,
  StyleSheet,
  Text,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { libraryApi } from '../apis/library';
import Button from '@/components/Button';
import { BookColor, COLOR_OPTIONS } from '@/constants/books';

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

  return (
    <View className="p-4">
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
        placeholder="Book title"
        value={title}
        onChangeText={setTitle}
        maxLength={30}
      />

      <ScrollView style={styles.colorScrollView}>
        <View style={styles.colorSelector}>
          {COLOR_OPTIONS.map((option) => (
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

      <Button
        onPress={handleCreateBook}
        label="Create Book"
        className="bg-[#F5829B] px-4 py-2"
        textClassName="text-white"
      />
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
