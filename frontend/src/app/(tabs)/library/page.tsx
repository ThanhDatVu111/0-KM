import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Modal,
  ImageBackground,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateBook } from '@/components/CreateBook';
import { EditBook } from '@/components/EditBook';
import { libraryApi } from '@/apis/library';
import type { Book } from '@/types/library';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import { BookCard } from '@/components/BookCard';
import { useRouter } from 'expo-router';
import images from '@/constants/images';

type SortOption = 'last_modified' | 'date_created' | 'name';

export default function Library() {
  const [sortOption, setSortOption] = useState<SortOption>('last_modified');
  const [books, setBooks] = useState<Book[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;
  const totalHorizontalPadding = 48; // 24px (px-6) on each side
  const gapBetweenCards = 16; // gap-4 between cards
  const totalGapWidth = gapBetweenCards * 2; // Gap for 2 spaces between 3 cards
  const cardWidth = (screenWidth - totalHorizontalPadding - totalGapWidth) / 3;
  const router = useRouter();

  // Fetch room ID
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    const loadRoom = async () => {
      try {
        const room = await fetchRoom({ user_id: userId });
        setRoomId(room.room_id);
      } catch (err) {
        console.error('Failed to fetch room. Please try again later.');
      }
    };
    loadRoom();
  }, [isLoaded, isSignedIn, userId]);

  // Fetch books
  const fetchBooks = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const fetchedBooks = await libraryApi.getBooks(roomId);
      setBooks(fetchedBooks);
      null;
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <ImageBackground
        source={images.sortButtonBg}
        resizeMode="contain"
        style={{
          width: 120,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: active ? 1 : 0.6,
        }}
      >
        <Text
          style={{
            fontFamily: 'PixelifySans',
            fontSize: 13,
            color: active ? '#E3518E' : '#000000',
          }}
        >
          {title}
        </Text>
      </ImageBackground>
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
      console.error(null);
    } catch (error: any) {
      console.error(error.message || 'Failed to delete book');
    }
  };

  return (
    <ImageBackground source={images.libraryBg} resizeMode="cover" className="flex-1">
      <SafeAreaView className="flex-1">
        <Text
          className="text-center mt-6 mb-6"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontFamily: 'PressStart2P',
            fontSize: 22,
            color: '#EE478D',
            textAlign: 'center',
            textShadowColor: 'black',
            textShadowOffset: { width: 3, height: 3 },
            textShadowRadius: 0,
          }}
        >
          Virtual Library
        </Text>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : (
          <View className="flex-1">
            {/* Sort options */}
            <View className="w-full flex items-center mt-2 mb-5">
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

            {/* Books grid */}
            <ScrollView className="px-6 mt-3" showsVerticalScrollIndicator={false}>
              <View
                className="flex-row flex-wrap gap-4 justify-between"
                style={{ paddingBottom: 200 }}
              >
                <BookCard
                  isNew
                  cardWidth={cardWidth}
                  onCreatePress={() => setIsCreateModalVisible(true)}
                />
                {sortedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    cardWidth={cardWidth}
                    isDropdownVisible={activeDropdownId === book.id}
                    onToggleDropdown={() =>
                      setActiveDropdownId(activeDropdownId === book.id ? null : book.id)
                    }
                    onEditPress={() => {
                      setActiveDropdownId(null);
                      setSelectedBook(book);
                    }}
                    onDeletePress={handleDeleteBook}
                    onPress={() => {
                      router.push({
                        pathname: `/library/[bookId]/page`,
                        params: { bookId: book.id, title: book.title },
                      });
                    }}
                  />
                ))}
                {[...Array(3)].map((_, index) => (
                  <View key={`placeholder-${index}`} style={{ width: cardWidth }} />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

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
          <View className="flex-1 justify-center items-center bg-black/30">
            <View
              className="w-[80%] max-h-[80%] bg-[#FFF0F5] border-2 border-black"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 6, height: 6 },
                shadowOpacity: 0.5,
              }}
            >
              {/* Header */}
              <View className="flex-row justify-between items-center border-b-2 border-black bg-[#FAD3E4] px-3 py-2">
                <View style={{ width: 20 }} />
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 18,
                  }}
                >
                  CREATE NEW BOOK
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsCreateModalVisible(false);
                    setCreateError(null);
                  }}
                  activeOpacity={0.8}
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#FFE4EC',
                    borderColor: '#000',
                    borderWidth: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'PixelifySans',
                      fontSize: 18,
                      color: '#000',
                      lineHeight: 20,
                    }}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error message */}
              {createError && (
                <View className="px-4 py-2 bg-[#ffe5e5] border-t border-b border-red-400">
                  <Text className="text-red-600 text-xs font-pixel">{createError}</Text>
                </View>
              )}

              {/* Content */}
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
                <View className="p-4">
                  <Text
                    className="text-center text-red-500 text-xs"
                    style={{ fontFamily: 'PixelifySans' }}
                  >
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
          <View className="flex-1 justify-center items-center bg-black/30">
            <View
              className="w-[80%] max-h-[80%] bg-[#FFF0F5] border-2 border-black"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 6, height: 6 },
                shadowOpacity: 0.5,
              }}
            >
              {/* Header */}
              <View className="flex-row justify-between items-center border-b-2 border-black bg-[#FAD3E4] px-3 py-2">
                <View style={{ width: 20 }} />
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 18,
                  }}
                >
                  EDIT BOOK
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBook(null);
                    setEditError(null);
                  }}
                  activeOpacity={0.8}
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#FFE4EC',
                    borderColor: '#000',
                    borderWidth: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'PixelifySans',
                      fontSize: 18,
                      color: '#000',
                      lineHeight: 20,
                    }}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error message */}
              {editError && (
                <View className="px-4 py-2 bg-[#ffe5e5] border-t border-b border-red-400">
                  <Text className="text-red-600 text-xs" style={{ fontFamily: 'PixelifySans' }}>
                    {editError}
                  </Text>
                </View>
              )}

              {/* Content */}
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
          <View className="flex-1 justify-center items-center bg-black/30">
            <View
              className="w-[80%] bg-[#FFF0F5] border-4 border-black"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 6, height: 6 },
                shadowOpacity: 0.5,
              }}
            >
              {/* Header */}
              <View className="flex-row justify-between items-center border-b-2 border-black bg-[#FAD3E4] px-3 py-2">
                <View style={{ width: 20 }} />
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 18,
                  }}
                >
                  DELETE BOOK
                </Text>
                <TouchableOpacity
                  onPress={() => setBookToDelete(null)}
                  activeOpacity={0.8}
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#FFE4EC',
                    borderColor: '#000',
                    borderWidth: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'PixelifySans',
                      fontSize: 18,
                      color: '#000',
                      lineHeight: 20,
                    }}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Message */}
              <View className="px-4 py-4">
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 14,
                    textAlign: 'center',
                    marginBottom: 10,
                  }}
                >
                  Are you sure you want to delete{' '}
                  <Text style={{ fontWeight: 'bold' }}>"{bookToDelete?.title}"</Text>?
                </Text>
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 12,
                    color: '#666',
                    textAlign: 'center',
                    marginBottom: 20,
                  }}
                >
                  This action cannot be undone.
                </Text>

                <View className="flex-row justify-end gap-2">
                  <TouchableOpacity
                    onPress={() => setBookToDelete(null)}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      backgroundColor: '#FAD3E4',
                      borderColor: '#000',
                      borderWidth: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 2, height: 2 },
                      shadowOpacity: 1,
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ fontFamily: 'PixelifySans', fontSize: 12, color: '#000' }}>
                      CANCEL
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={confirmDelete}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      backgroundColor: '#FF5C8D',
                      borderColor: '#000',
                      borderWidth: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 2, height: 2 },
                      shadowOpacity: 1,
                    }}
                  >
                    <Text style={{ fontFamily: 'PixelifySans', fontSize: 12, color: '#fff' }}>
                      DELETE
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}
