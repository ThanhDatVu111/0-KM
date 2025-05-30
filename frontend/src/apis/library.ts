import { Book, CreateBookDTO, UpdateBookDTO } from '../types/library';

const host = process.env.EXPO_PUBLIC_API_HOST;
const port = process.env.EXPO_PUBLIC_API_PORT;

if (!host || !port) {
  throw new Error('Missing LOCAL_HOST_URL or PORT in your environment');
}
const BASE_URL = `${host}:${port}`;

export const libraryApi = {
  createBook: async (book: CreateBookDTO): Promise<Book> => {
    try {
      const response = await fetch(`${BASE_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create book');
      }

      return result.data;
    } catch (err: any) {
      if (err.name === 'TypeError') {
        throw new Error(
          `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
        );
      }
      throw err;
    }
  },

  updateBook: async (id: string, book: UpdateBookDTO): Promise<Book> => {
    try {
      const response = await fetch(`${BASE_URL}/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update book');
      }

      return result.data;
    } catch (err: any) {
      if (err.name === 'TypeError') {
        throw new Error(
          `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
        );
      }
      throw err;
    }
  },

  getBooks: async (coupleId: string): Promise<Book[]> => {
    try {
      const response = await fetch(`${BASE_URL}/books?coupleId=${coupleId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch books');
      }

      return result.data;
    } catch (err: any) {
      if (err.name === 'TypeError') {
        throw new Error(
          `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
        );
      }
      throw err;
    }
  },

  getBook: async (id: string): Promise<Book> => {
    try {
      const response = await fetch(`${BASE_URL}/books/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch book');
      }

      return result.data;
    } catch (err: any) {
      if (err.name === 'TypeError') {
        throw new Error(
          `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
        );
      }
      throw err;
    }
  },
};
