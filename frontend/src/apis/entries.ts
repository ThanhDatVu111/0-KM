const host = process.env.EXPO_PUBLIC_API_HOST;
const port = process.env.EXPO_PUBLIC_API_PORT;
const BASE_URL = `${host}:${port}`;

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

export async function CreateEntries(entryData: {
  id: string;
  book_id: string;
  title: string;
  body: string | null;
  location: { address: string } | null;
  pin: boolean;
  media: { uri: string; type: 'image' | 'video' }[];
  created_at: string;
}): Promise<any[]> {
  try {
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