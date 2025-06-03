import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateBook } from '@/components/CreateBook';
import { libraryApi } from '@/apis/library';
import type { Book } from '@/types/library';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';

type SortOption = 'last_modified' | 'date_created' | 'name';

export default function Library() {
  const [sortOption, setSortOption] = useState<SortOption>('last_modified');
  const [books, setBooks] = useState<Book[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const { userId, isLoaded, isSignedIn } = useAuth();
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 3;

  // Fetch room ID
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    const getRoomId = async () => {
      try {
        const room = await fetchRoom({ user_id: userId });
        setRoomId(room.room_id);
      } catch (error: any) {
        setError('Failed to fetch room. Please try again later.');
      }
    };

    getRoomId();
  }, [isLoaded, isSignedIn, userId]);

  // Fetch books
  const fetchBooks = async () => {
    if (!roomId) return;

    try {
      const fetchedBooks = await libraryApi.getBooks(roomId);
      setBooks(fetchedBooks);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchBooks();
    }
  }, [roomId]);

  // Sort books based on selected option
  const sortedBooks = React.useMemo(() => {
    const booksToSort = [...books];
    switch (sortOption) {
      case 'last_modified':
        return booksToSort.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
      case 'date_created':
        return booksToSort.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      case 'name':
        return booksToSort.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return booksToSort;
    }
  }, [books, sortOption]);

  const SortButton = ({
    title,
    active,
    onPress,
  }: {
    title: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full mx-1 ${active ? 'bg-pink-100' : 'bg-gray-100'}`}
    >
      <Text className={`${active ? 'text-pink-600' : 'text-gray-600'}`}>{title}</Text>
    </TouchableOpacity>
  );

  const BookCard = ({ isNew, book }: { isNew?: boolean; book?: Book }) => {
    const getBookImage = (color?: string) => {
      switch (color) {
        case 'blue':
          return require('@/assets/images/blue book.png');
        case 'green':
          return require('@/assets/images/green book.png');
        case 'yellow':
          return require('@/assets/images/yellow book.png');
        case 'purple':
          return require('@/assets/images/purple book.png');
        case 'red':
          return require('@/assets/images/red book.png');
        case 'pink':
        default:
          return require('@/assets/images/book.png');
      }
    };

    return (
      <View style={{ width: cardWidth }} className="mb-4">
        {isNew ? (
          <TouchableOpacity
            className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
            onPress={() => setIsCreateModalVisible(true)}
          >
            <View className="w-16 h-16 rounded-full bg-pink-100 items-center justify-center">
              <Text className="text-3xl text-pink-500">+</Text>
            </View>
            <Text className="mt-2 text-gray-500 text-lg">new</Text>
          </TouchableOpacity>
        ) : book ? (
          <View>
            <Image
              source={getBookImage(book.color)}
              style={{
                width: cardWidth,
                height: cardWidth * (4 / 3),
                resizeMode: 'contain',
              }}
            />
            <View className="bg-white mt-1 px-1">
              <Text
                className="text-center text-sm font-medium text-gray-800"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {book.title}
              </Text>
              <Text className="text-center text-xs text-gray-600 mt-0.5">
                {new Date(book.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-2">
        <Text className="text-2xl font-bold text-pink-500 text-center mb-4">Virtual Library</Text>

        {/* Sort options */}
        <View className="items-center mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
            }}
          >
            <SortButton
              title="Last modified"
              active={sortOption === 'last_modified'}
              onPress={() => setSortOption('last_modified')}
            />
            <SortButton
              title="Date created"
              active={sortOption === 'date_created'}
              onPress={() => setSortOption('date_created')}
            />
            <SortButton
              title="Name"
              active={sortOption === 'name'}
              onPress={() => setSortOption('name')}
            />
          </ScrollView>
        </View>
      </View>

      {/* Error message */}
      {error && (
        <View className="px-4 py-2 bg-red-100">
          <Text className="text-red-600">{error}</Text>
        </View>
      )}

      {/* Books grid */}
      <ScrollView className="flex-1 px-4">
        <View className="flex-row flex-wrap justify-between">
          <BookCard isNew />
          {sortedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </View>
      </ScrollView>

      {/* Create Book Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCreateModalVisible}
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-[70%] max-h-[80%] bg-white rounded-lg overflow-hidden">
            <View className="py-1.5 border-b border-gray-200">
              <Text className="text-sm font-semibold text-center">Create New Book</Text>
            </View>

            {roomId ? (
              <CreateBook
                coupleId={roomId}
                onSuccess={() => {
                  setIsCreateModalVisible(false);
                  fetchBooks();
                }}
                onError={(error) => setError(error)}
              />
            ) : (
              <View className="p-3">
                <Text className="text-center text-red-500 text-xs">
                  Unable to create book. Please make sure you're connected to a room.
                </Text>
              </View>
            )}

            <TouchableOpacity
              className="py-2 border-t border-gray-200"
              onPress={() => setIsCreateModalVisible(false)}
            >
              <Text className="text-center text-gray-500 text-xs">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
