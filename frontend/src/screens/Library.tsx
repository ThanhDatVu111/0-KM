import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import images from '@/constants/images';

type SortOption = 'last_modified' | 'date_created' | 'name';

interface BookItem {
  id: string;
  title: string;
  date: string;
  lastModified: string;
}

export default function Library() {
  const [sortOption, setSortOption] = useState<SortOption>('last_modified');
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 3;

  // Generate random book data
  const books: BookItem[] = useMemo(() => {
    const titles = [
      'Love Story',
      'Adventure Tales',
      'Mystery House',
      'Summer Days',
      'Winter Dreams',
      'Spring Romance',
      'Autumn Leaves',
      'Sunset Boulevard',
    ];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
    const days = Array.from({ length: 28 }, (_, i) => i + 1);
    const years = [2023, 2024, 2025];
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);

    return Array.from({ length: 8 }, (_, i) => {
      const createdMonth = months[Math.floor(Math.random() * months.length)];
      const createdDay = days[Math.floor(Math.random() * days.length)];
      const createdYear = years[Math.floor(Math.random() * years.length)];
      const createdHour = hours[Math.floor(Math.random() * hours.length)];

      const modifiedMonth = months[Math.floor(Math.random() * months.length)];
      const modifiedDay = days[Math.floor(Math.random() * days.length)];
      const modifiedYear = years[Math.floor(Math.random() * years.length)];
      const modifiedHour = hours[Math.floor(Math.random() * hours.length)];

      return {
        id: String(i + 1),
        title: titles[i],
        date: `${createdMonth} ${createdDay}, ${createdYear} at ${createdHour}:00 pm`,
        lastModified: `${modifiedMonth} ${modifiedDay}, ${modifiedYear} at ${modifiedHour}:00 pm`,
      };
    });
  }, []);

  // Sort books based on selected option
  const sortedBooks = useMemo(() => {
    const booksToSort = [...books];
    switch (sortOption) {
      case 'last_modified':
        return booksToSort.sort(
          (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
        );
      case 'date_created':
        return booksToSort.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  const BookCard = ({ isNew, title, date }: { isNew?: boolean; title?: string; date?: string }) => (
    <View style={{ width: cardWidth }} className="aspect-[3/4] mb-4">
      {isNew ? (
        <TouchableOpacity className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-pink-100 items-center justify-center">
            <Text className="text-3xl text-pink-500">+</Text>
          </View>
          <Text className="mt-2 text-gray-500 text-lg">new</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity className="w-full h-full items-center justify-center">
          <Image source={images.book} className="w-full h-full" resizeMode="contain" />
          <View className="absolute bottom-0 w-full px-1 pb-2">
            <Text className="text-center text-xs font-medium text-gray-800">{title}</Text>
            <Text className="text-center text-xs text-gray-600">{date}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

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

      {/* Books grid */}
      <ScrollView className="flex-1 px-4">
        <View className="flex-row flex-wrap justify-between">
          <BookCard isNew />
          {sortedBooks.map((book) => (
            <BookCard key={book.id} title={book.title} date={book.date} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
