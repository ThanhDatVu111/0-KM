'use client';

import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import uuid from 'react-native-uuid';
import EntryForm from '@/components/EntryForm';
import { CreateEntry } from '@/apis/entries';

export default function NewEntryScreen() {
  const router = useRouter();
  const { bookId: rawBookId } = useLocalSearchParams<{ bookId: string }>();
  const [saving, setSaving] = useState(false);
  const bookId = Array.isArray(rawBookId) ? rawBookId[0]! : rawBookId!;
  const now = new Date();

  /** Called by EntryForm when “Done” is tapped with the new entry’s data */
  const handleCreate = async (data: {
    id: string;
    book_id: string;
    title: string;
    body: string | null;
    location: { address: string } | null;
    media_paths: string[];
    created_at?: string;
  }) => {
    try {
      // Generate a brand‐new UUID for this entry
      const newId = (uuid.v4() as string) || '';
      const toCreate = { ...data, id: newId, created_at: new Date().toISOString() };
      await CreateEntry(toCreate);
      
      // Navigate back with refresh parameter to trigger refetch
      router.push({
        pathname: `/library/[bookId]/page`,
        params: { 
          bookId, 
          refresh: Date.now().toString() // Use timestamp to ensure it's always different
        }
      });
    } catch (err: any) {
      console.error('CreateEntries error:', err);
      router.back(); // Still go back on error, but without refresh
    }
  };

  return (
    <EntryForm
      bookId={bookId}
      saving={saving}
      initialCreatedAt={now.toISOString()}
      onSubmit={async (entryData) => {
        setSaving(true);
        await handleCreate(entryData);
        setSaving(false);
      }}
    />
  );
}
