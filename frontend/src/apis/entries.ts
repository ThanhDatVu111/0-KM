const host = process.env.EXPO_PUBLIC_API_HOST;
const port = process.env.EXPO_PUBLIC_API_PORT;
import { BASE_URL } from './apiClient';

console.log('BASE_URL in api entries:', BASE_URL);

export async function fetchEntries(book_id: string): Promise<any[]> {
  try {
    const response = await fetch(`${BASE_URL}/entries/${book_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch entries');
    }

    return result.data; // Return the fetched entries
  } catch (err: any) {
    throw err;
  }
}

export async function CreateEntry(entryData: {
  id: string;
  book_id: string;
  title: string;
  body: string | null;
  location: { address: string } | null;
  media: { uri: string; type: 'image' | 'video' }[];
  created_at: string;
}): Promise<any[]> {
  try {
    console.log('Creating new entry with data in apis entry:', entryData);
    const response = await fetch(`${BASE_URL}/entries/${entryData.book_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create entries');
    }

    return result.data; // Return the created entries
  } catch (err: any) {
    throw err;
  }
}

export async function deleteEntryApi(book_id: string, entry_id: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/entries/${book_id}/${entry_id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete entry in frontend api');
    }
  } catch (err: any) {
    throw err;
  }
}

export async function updateEntryApi(updatedEntryData: {
  id: string | string[]; // Use existing ID for update
  book_id: string;
  title: string;
  body: string | null;
  location: { address: string | string[] } | null;
  media: { uri: string; type: 'image' | 'video' }[];
  updated_at?: string; 
}) {
  try {
    const response = await fetch(`${BASE_URL}/entries/${updatedEntryData.book_id}/${updatedEntryData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedEntryData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update entry: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating entry in api entries:', error);
    throw error;
  }
}