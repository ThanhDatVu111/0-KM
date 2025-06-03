import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateBook } from '../components/CreateBook';
import { EditBook } from '../components/EditBook';
import { libraryApi } from '../apis/library';
import type { Book } from '../types/library';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '../apis/room';
import { MaterialIcons } from '@expo/vector-icons';

type SortOption = 'last_modified' | 'date_created' | 'name';

export default function Library() {
  const [sortOption, setSortOption] = useState<SortOption>('last_modified');
  const [books, setBooks] = useState<Book[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const { userId, isLoaded, isSignedIn } = useAuth();
  const screenWidth = Dimensions.get('window').width;

  // Calculate dimensions and gaps
  const containerPadding = 16; // px-4 equals 16px
  const gap = 12;
  const availableWidth = screenWidth - containerPadding * 2;
  const cardWidth = (availableWidth - gap * 2) / 3; // Width for 3 columns with gaps

  // Add logging for modal visibility changes
  useEffect(() => {
    console.log('📖 Create modal visibility:', isCreateModalVisible);
    console.log('📖 Current room ID:', roomId);
  }, [isCreateModalVisible, roomId]);

  // Fetch room ID
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      console.log('🔍 Auth state:', { isLoaded, isSignedIn, userId });
      return;
    }

    const getRoomId = async () => {
      try {
        console.log('📱 Fetching room for user:', userId);
        const room = await fetchRoom({ user_id: userId });
        console.log('✅ Room fetched:', room);

        if (!room) {
          console.log('❌ No room found for user');
          setError('No room found. Please make sure you are connected to a room.');
          return;
        }

        if (!room.room_id) {
          console.log('❌ Room found but no room_id present:', room);
          setError('Invalid room data. Please try again later.');
          return;
        }

        console.log('✅ Setting room ID:', room.room_id);
        setRoomId(room.room_id);
        setError(null);
      } catch (error: any) {
        console.error('❌ Error fetching room:', error);
        setError('Failed to fetch room. Please try again later.');
      }
    };

    getRoomId();
  }, [isLoaded, isSignedIn, userId]);

  // Fetch books
  const fetchBooks = async () => {
    if (!roomId) {
      console.log('❌ Cannot fetch books: No room ID available');
      return;
    }

    try {
      console.log('📚 Fetching books for room:', roomId);
      const fetchedBooks = await libraryApi.getBooks(roomId);
      console.log('✅ Books fetched:', fetchedBooks);
      setBooks(fetchedBooks);
      setError(null);
    } catch (error: any) {
      console.error('❌ Error fetching books:', error);
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

  const getBookImage = (color?: string) => {
    switch (color) {
      case 'blue':
        return require('../assets/images/blue book.png');
      case 'green':
        return require('../assets/images/green book.png');
      case 'yellow':
        return require('../assets/images/yellow book.png');
      case 'purple':
        return require('../assets/images/purple book.png');
      case 'red':
        return require('../assets/images/red book.png');
      case 'pink':
      default:
        return require('../assets/images/book.png');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await libraryApi.deleteBook(bookId);
      fetchBooks();
      setOpenDropdownId(null);
    } catch (error: any) {
      setError(error.message || 'Failed to delete book');
    }
  };

  const BookCard = ({ isNew, book }: { isNew?: boolean; book?: Book }) => {
    const isDropdownOpen = book && openDropdownId === book.id;

    return (
      <View
        style={{
          width: cardWidth,
          marginRight: gap,
          marginBottom: gap,
        }}
      >
        {isNew ? (
          <TouchableOpacity
            className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
            onPress={() => {
              console.log('📖 Opening create book modal');
              setIsCreateModalVisible(true);
            }}
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
              <View className="flex-row items-center justify-center">
                <Text
                  className="text-center text-sm font-medium text-gray-800 flex-1"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {book.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setOpenDropdownId(isDropdownOpen ? null : book.id)}
                  className="px-1"
                >
                  <MaterialIcons
                    name={isDropdownOpen ? 'arrow-drop-up' : 'arrow-drop-down'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <Text className="text-center text-xs text-gray-600 mt-0.5">
                {new Date(book.created_at).toLocaleDateString()}
              </Text>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <View
                  className="absolute bg-white border border-gray-200 rounded-md shadow-md mt-1"
                  style={{
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    elevation: 5, // for Android
                  }}
                >
                  <TouchableOpacity
                    className="px-3 py-2 border-b border-gray-200 flex-row items-center"
                    onPress={() => {
                      setSelectedBook(book);
                      setIsEditModalVisible(true);
                      setOpenDropdownId(null);
                    }}
                  >
                    <MaterialIcons name="edit" size={16} color="#666" />
                    <Text className="ml-2 text-sm text-gray-600">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="px-3 py-2 flex-row items-center"
                    onPress={() => handleDeleteBook(book.id)}
                  >
                    <MaterialIcons name="delete" size={16} color="#dc2626" />
                    <Text className="ml-2 text-sm text-red-600">Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
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
      <ScrollView className="flex-1 px-4" style={{ zIndex: 1 }}>
        <View
          className="flex-row flex-wrap"
          style={{
            marginRight: -gap, // Compensate for the last column's margin
          }}
        >
          <BookCard isNew />
          {sortedBooks.map((book) => (
            <View key={book.id} style={{ zIndex: openDropdownId === book.id ? 1000 : 1 }}>
              <BookCard book={book} />
            </View>
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

      {/* Edit Book Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => {
          setIsEditModalVisible(false);
          setSelectedBook(null);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-[70%] max-h-[80%] bg-white rounded-lg overflow-hidden">
            <View className="py-1.5 border-b border-gray-200">
              <Text className="text-sm font-semibold text-center">Edit Book</Text>
            </View>

            {selectedBook && (
              <EditBook
                book={selectedBook}
                onSuccess={() => {
                  setIsEditModalVisible(false);
                  setSelectedBook(null);
                  fetchBooks();
                }}
                onError={(error) => setError(error)}
                onCancel={() => {
                  setIsEditModalVisible(false);
                  setSelectedBook(null);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
