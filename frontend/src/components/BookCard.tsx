import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BOOK_IMAGES, BookColor } from '@/constants/books';
import type { Book } from '@/types/library';

interface BookCardProps {
  isNew?: boolean;
  book?: Book;
  cardWidth: number;
  onCreatePress?: () => void;
  onEditPress?: (book: Book) => void;
  onDeletePress?: (book: Book) => void;
  isDropdownVisible?: boolean;
  onToggleDropdown?: () => void;
  onPress?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  isNew,
  book,
  cardWidth,
  onCreatePress,
  onEditPress,
  onDeletePress,
  isDropdownVisible,
  onToggleDropdown,
  onPress,
}) => {
  const getBookImage = (color?: string) => {
    return BOOK_IMAGES[color as BookColor] || BOOK_IMAGES.pink;
  };

  if (isNew) {
    return (
      <View style={{ width: cardWidth }} className="">
        <TouchableOpacity
          onPress={onCreatePress}
          activeOpacity={0.8}
          style={{
            aspectRatio: 1,
            borderWidth: 3,
            borderColor: '#000',
            backgroundColor: '#FAD3E4',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.4,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 32,
              color: '#000',
              marginBottom: 4,
            }}
          >
            +
          </Text>
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 10,
              color: '#000',
              marginTop: -4,
            }}
          >
            CREATE
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!book) return null;

  return (
    <View style={{ width: cardWidth }}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={() => onToggleDropdown?.()}
        delayLongPress={1000}
        className="rounded-lg"
      >
        <Image
          source={getBookImage(book.color)}
          style={{
            width: cardWidth,
            height: cardWidth,
            resizeMode: 'contain',
          }}
        />
      </TouchableOpacity>
      <View className="mt-1" style={{ position: 'relative', zIndex: 1 }}>
        <View className="flex-row justify-between items-start pr-0">
          <Text
            className="flex-1 text-sm font-medium text-black px-1 text-center"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {book.title}
          </Text>

          {isDropdownVisible && (
            <View
              style={{
                position: 'absolute',
                right: 10,
                top: -35,
                backgroundColor: '#FAD3E4',
                borderWidth: 3,
                borderColor: '#000',
                width: 96,
                zIndex: 50,
                shadowColor: '#000',
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                paddingVertical: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => onEditPress?.(book)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                }}
              >
                <MaterialCommunityIcons name="pencil" size={14} color="#000" />
                <Text
                  style={{
                    marginLeft: 6,
                    fontFamily: 'PixelifySans',
                    fontSize: 12,
                    color: '#000',
                  }}
                >
                  Edit
                </Text>
              </TouchableOpacity>

              <View style={{ height: 2, backgroundColor: '#000' }} />

              <TouchableOpacity
                onPress={() => onDeletePress?.(book)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                }}
              >
                <MaterialCommunityIcons name="delete" size={14} color="red" />
                <Text
                  style={{
                    marginLeft: 6,
                    fontFamily: 'PixelifySans',
                    fontSize: 12,
                    color: 'red',
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text className="text-xs text-black mt-0.5 px-1 text-center">
          {new Date(book.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};
