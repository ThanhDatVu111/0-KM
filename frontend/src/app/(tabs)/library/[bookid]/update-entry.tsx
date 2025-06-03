// /app/(tabs)/library/[bookId]/update-entry/[entryId].tsx
'use client';

import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import EntryForm, { MediaItem } from '@/components/EntryForm';
import { updateEntryApi } from '@/apis/entries';

export default function UpdateEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | undefined>;

  // Extract required route params
  const rawBookId = params.bookId!;
  const bookId = Array.isArray(rawBookId) ? rawBookId[0]! : rawBookId;
  if (bookId) {
    console.log('bookId provided in params in UpdateEntryScreen', bookId);
  }
  const rawEntryId = params.entryId!;
  const entryId = Array.isArray(rawEntryId) ? rawEntryId[0]! : rawEntryId;
  if (entryId) {
    console.log('enryId provided in params in UpdateEntryScreen', entryId);
  }

  const initialTitle = params.title || '';
  const initialBody = params.body || '';

  // media is JSON‐stringified, so parse it back
  let parsedMedia: MediaItem[] = [];
  if (params.media) {
    try {
      const s = Array.isArray(params.media) ? params.media[0]! : params.media;
      parsedMedia = JSON.parse(s);
    } catch (e) {
      console.error('Failed to parse initial media:', e);
      parsedMedia = [];
    }
  }
  const initialLocation = params.location || '';
  const initialCreatedAt = params.updatedAt || new Date().toISOString();

  const [saving, setSaving] = useState(false);

  /** Called by EntryForm when “Done” is tapped */
  const handleUpdate = async (data: {
    id: string;
    book_id: string;
    title: string;
    body: string | null;
    location: { address: string } | null;
    pin: boolean;
    media: { uri: string; type: 'image' | 'video' }[];
    created_at?: string;
    updated_at?: string;
  }) => {
    try {
      await updateEntryApi(data);
      router.back();
    } catch (err: any) {
      console.error('updateEntryApi error:', err);
      alert('Failed to update entry. Please try again.');
    }
  };

  return (
    <EntryForm
      bookId={bookId}
      entryId={entryId}
      initialTitle={initialTitle}
      initialBody={initialBody}
      initialMedia={parsedMedia}
      initialLocation={initialLocation}
      initialCreatedAt={initialCreatedAt}
      saving={saving}
      onSubmit={async (data) => {
        setSaving(true);
        data.id = entryId; // ensure we update the correct ID
        data.book_id = bookId; // ensure we update the correct book ID
        await handleUpdate(data);
        setSaving(false);
      }}
    />
  );
}
