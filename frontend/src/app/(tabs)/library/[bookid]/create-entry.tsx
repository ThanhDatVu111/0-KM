'use client';

import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import uuid from 'react-native-uuid';
import EntryForm from '@/components/EntryForm';
import { CreateEntry } from '@/apis/entries';

export default function NewEntryScreen() {
  const router = useRouter();
  const { bookId: rawBookId } = useLocalSearchParams<{ bookId: string }>();
  const bookId = Array.isArray(rawBookId) ? rawBookId[0]! : rawBookId!;

  const [saving, setSaving] = useState(false);

  /** Called by EntryForm when “Done” is tapped with the new entry’s data */
  const handleCreate = async (data: {
    id: string;
    book_id: string;
    title: string;
    body: string | null;
    location: { address: string } | null;
    media: { uri: string; type: 'image' | 'video' }[];
    created_at?: string;
  }) => {
    try {
      console.log('Creating new entry with data:', data);
      // Generate a brand‐new UUID for this entry
      const newId = (uuid.v4() as string) || '';
      const toCreate = { ...data, id: newId, created_at: new Date().toISOString() };
      await CreateEntry(toCreate);
    } catch (err: any) {
      console.error('CreateEntries error:', err);
    }
    router.back();
  };

  return (
    <EntryForm
      bookId={bookId}
      saving={saving}
      onSubmit={async (entryData) => {
        setSaving(true);
        await handleCreate(entryData);
        setSaving(false);
      }}
    />
  );
}
