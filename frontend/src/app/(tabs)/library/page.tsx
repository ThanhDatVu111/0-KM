import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateBook } from '@/components/CreateBook';
import { EditBook } from '@/components/EditBook';
import { libraryApi } from '@/apis/library';
import type { Book } from '@/types/library';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type SortOption = 'last_modified' | 'date_created' | 'name';

export default function Library() {
  const [sortOption, setSortOption] = useState<SortOption>('last_modified');
  const [books, setBooks] = useState<Book[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const { userId, isLoaded, isSignedIn } = useAuth();
  const screenWidth = Dimensions.get('window').width;
  const totalHorizontalPadding = 64; // 32px on each side
  const gapBetweenCards = 16; // 16px between each card
  const totalGapWidth = gapBetweenCards * 2; // Gap for 2 spaces between 3 cards
  const cardWidth = (screenWidth - totalHorizontalPadding - totalGapWidth) / 3;

  // Fetch room ID
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    const loadRoom = async () => {
      try {
        const room = await fetchRoom({ user_id: userId });
        setRoomId(room.room_id);
      } catch (err) {
        setError('Failed to fetch room. Please try again later.');
      }
    };

    loadRoom();
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

  const handleDeleteBook = async (book: Book) => {
    setActiveDropdownId(null);
    setBookToDelete(book);
  };

  const confirmDelete = async () => {
    if (!bookToDelete) return;

    try {
      await libraryApi.deleteBook(bookToDelete.id);
      await fetchBooks();
      setBookToDelete(null);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to delete book');
    }
  };

  const BookCard = ({ isNew, book }: { isNew?: boolean; book?: Book }) => {
    const isDropdownVisible = book ? activeDropdownId === book.id : false;

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

    const handleEdit = () => {
      if (!book) return;
      setActiveDropdownId(null);
      setSelectedBook(book);
    };

    const toggleDropdown = () => {
      if (!book) return;
      setActiveDropdownId(isDropdownVisible ? null : book.id);
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
            <View className="bg-white mt-1">
              <View className="flex-row justify-between items-start pr-0">
                <Text
                  className="flex-1 text-sm font-medium text-gray-800 px-1"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {book.title}
                </Text>
                <View className="relative">
                  <TouchableOpacity onPress={toggleDropdown} className="p-1 -mr-1">
                    <MaterialCommunityIcons name="dots-vertical" size={18} color="#666" />
                  </TouchableOpacity>
                  {isDropdownVisible && (
                    <View className="absolute right-0 top-8 bg-white rounded-lg shadow-lg z-50 w-24 py-1 border border-gray-200">
                      <TouchableOpacity
                        onPress={handleEdit}
                        className="flex-row items-center px-3 py-2"
                      >
                        <MaterialCommunityIcons name="pencil" size={16} color="#666" />
                        <Text className="ml-2 text-sm text-gray-600">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteBook(book)}
                        className="flex-row items-center px-3 py-2"
                      >
                        <MaterialCommunityIcons name="delete" size={16} color="#FF4444" />
                        <Text className="ml-2 text-sm text-red-500">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              <Text className="text-xs text-gray-600 mt-0.5 px-1">
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
      <Pressable onPress={() => setActiveDropdownId(null)} style={{ flex: 1 }}>
        <View className="items-center py-2">
          <Text className="text-2xl font-bold text-gray-800 mb-4">Library</Text>

          {/* Sort options */}
          <View className="mb-4 w-full flex items-center">
            <View className="flex-row gap-2">
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
            </View>
          </View>
        </View>

        {/* Error message - only show non-form errors */}
        {error && (
          <View className="px-4 py-2 bg-red-100">
            <Text className="text-red-600">{error}</Text>
          </View>
        )}

        {/* Books grid */}
        <ScrollView className="flex-1 px-8">
          <View
            className="flex-row flex-wrap gap-2"
            style={{ marginRight: -16, paddingBottom: 100 }}
          >
            <BookCard isNew />
            {sortedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
            {/* Add invisible placeholder cards to maintain grid alignment */}
            {[...Array(3)].map((_, index) => (
              <View key={`placeholder-${index}`} style={{ width: cardWidth }} />
            ))}
          </View>
        </ScrollView>

        {/* Create Book Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isCreateModalVisible}
          onRequestClose={() => {
            setIsCreateModalVisible(false);
            setCreateError(null);
          }}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="w-[70%] max-h-[80%] bg-white rounded-lg overflow-hidden">
              <View className="py-1.5 border-b border-gray-200 flex-row justify-between items-center px-4">
                <View style={{ width: 20 }} /> {/* Empty view for centering */}
                <Text className="text-sm font-semibold">Create New Book</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsCreateModalVisible(false);
                    setCreateError(null);
                  }}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {createError && (
                <View className="px-4 py-2 bg-red-50">
                  <Text className="text-red-600 text-sm">{createError}</Text>
                </View>
              )}

              {roomId ? (
                <CreateBook
                  coupleId={roomId}
                  onSuccess={() => {
                    setIsCreateModalVisible(false);
                    setCreateError(null);
                    fetchBooks();
                  }}
                  onError={(error) => setCreateError(error)}
                />
              ) : (
                <View className="p-3">
                  <Text className="text-center text-red-500 text-xs">
                    Unable to create book. Please make sure you're connected to a room.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Edit Book Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedBook}
          onRequestClose={() => {
            setSelectedBook(null);
            setEditError(null);
          }}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="w-[70%] max-h-[80%] bg-white rounded-lg overflow-hidden">
              <View className="py-1.5 border-b border-gray-200 flex-row justify-between items-center px-4">
                <View style={{ width: 20 }} /> {/* Empty view for centering */}
                <Text className="text-sm font-semibold">Edit Book</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBook(null);
                    setEditError(null);
                  }}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {editError && (
                <View className="px-4 py-2 bg-red-50">
                  <Text className="text-red-600 text-sm">{editError}</Text>
                </View>
              )}

              {selectedBook && (
                <EditBook
                  book={selectedBook}
                  onSuccess={() => {
                    setSelectedBook(null);
                    setEditError(null);
                    fetchBooks();
                  }}
                  onError={(error) => setEditError(error)}
                  onCancel={() => {
                    setSelectedBook(null);
                    setEditError(null);
                  }}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!bookToDelete}
          onRequestClose={() => setBookToDelete(null)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="w-[70%] bg-white rounded-lg overflow-hidden">
              <View className="p-4">
                <Text className="text-lg font-semibold text-center mb-2">Delete Book</Text>
                <Text className="text-center text-gray-600 mb-4">
                  Are you sure you want to delete "{bookToDelete?.title}"? This action cannot be
                  undone.
                </Text>
                <View className="flex-row justify-end gap-2">
                  <TouchableOpacity
                    onPress={() => setBookToDelete(null)}
                    className="px-4 py-2 rounded-lg bg-gray-100"
                  >
                    <Text className="text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmDelete}
                    className="px-4 py-2 rounded-lg bg-red-500"
                  >
                    <Text className="text-white">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </Pressable>
    </SafeAreaView>
  );
}
