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
  const rawEntryId = params.entryId!;
  const entryId = Array.isArray(rawEntryId) ? rawEntryId[0]! : rawEntryId;

  const initialTitle = params.title || '';
  const initialBody = params.body || '';
  const initialLocation = params.location || '';
  const initialUpdatedAt = new Date().toISOString();
  const initialMedia: MediaItem[] = params.media
    ? params.media
        .split(',')
        .filter((url) => url.trim() !== '')
        // For each image URL, set both `uri` and `cloudinaryUrl` to the Cloudinary URL.
        // This tells EntryForm that the image is already uploaded and should not be re-uploaded.
        // Also determine if it's a video based on the file extension.
        .map((url) => {
          const trimmed = url.trim();
          const isVideo = /\.(mp4|mov|webm)$/i.test(trimmed);
          return {
            uri: trimmed,
            cloudinaryUrl: trimmed,
            type: isVideo ? 'video' : 'image',
          };
        })
    : [];
  const [saving, setSaving] = useState(false);

  /** Called by EntryForm when “Done” is tapped */
  const handleUpdate = async (data: {
    id: string;
    book_id: string;
    title: string;
    body: string | null;
    location: { address: string } | null;
    pin: boolean;
    media_paths: string[];
    updated_at?: string;
  }) => {
    try {
      await updateEntryApi(data);
      // Navigate back with refresh parameter to trigger refetch
      router.push({
        pathname: `/library/[bookId]/page`,
        params: {
          bookId,
          refresh: Date.now().toString(), // Use timestamp to ensure it's always different
        },
      });
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
      initialMedia={initialMedia}
      initialLocation={initialLocation}
      initialCreatedAt={undefined} // not required for updating an entry; set to undefined
      initialUpdatedAt={initialUpdatedAt}
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
