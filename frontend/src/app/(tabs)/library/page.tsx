import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateBook } from '@/components/CreateBook';
import { EditBook } from '@/components/EditBook';
import { libraryApi } from '@/apis/library';
import type { Book } from '@/types/library';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import Button from '@/components/Button';
import { BookCard } from '@/components/BookCard';
import { useRouter } from 'expo-router';

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
    <View className="flex justify-center">
      <Button
        onPress={onPress}
        label={title}
        className={`px-4 py-2 ${active ? 'bg-primary' : 'bg-gray-100'}`}
        textClassName={`${active ? 'text-pink-600' : 'text-gray-600'}`}
      />
    </View>
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Pressable onPress={() => setActiveDropdownId(null)} style={{ flex: 1 }}>
        <View className="items-center py-2">
          <Text className="text-2xl font-bold text-accent mb-4">Our Library</Text>

          {/* Sort options */}
          <View className="w-full flex items-center mt-5">
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
        <ScrollView className="flex-1 px-6">
          <View className="flex-row flex-wrap gap-4 justify-between" style={{ paddingBottom: 200 }}>
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
                     params: { bookId: book.id, title: book.title }, // Pass the book ID and title as parameters
                   });
                }}
              />
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
                <Button
                  onPress={() => {
                    setIsCreateModalVisible(false);
                    setCreateError(null);
                  }}
                  label="×"
                  className="p-1 -mr-2"
                  textClassName="text-gray-600 text-xl leading-none"
                />
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
                <Button
                  onPress={() => {
                    setSelectedBook(null);
                    setEditError(null);
                  }}
                  label="×"
                  className="p-1 -mr-2"
                  textClassName="text-gray-600 text-xl leading-none"
                />
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
                  <Button
                    onPress={() => setBookToDelete(null)}
                    label="Cancel"
                    className="bg-gray-100 px-4 py-2"
                    textClassName="text-gray-600"
                  />
                  <Button
                    onPress={confirmDelete}
                    label="Delete"
                    className="bg-[#F5829B] px-4 py-2"
                    textClassName="text-white"
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </Pressable>
    </SafeAreaView>
  );
}
