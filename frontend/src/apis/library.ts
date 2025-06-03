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
      console.log('📚 Creating book:', book);

      const response = await fetch(`${BASE_URL}/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });

      const result = await response.json();
      console.log('📚 Create book response:', {
        status: response.status,
        ok: response.ok,
        data: result.data,
        error: result.error,
      });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create book');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error creating book:', {
        error,
        message: error.message,
        book,
      });
      throw error;
    }
  },

  updateBook: async (id: string, book: UpdateBookDTO): Promise<Book> => {
    try {
      const response = await fetch(`${BASE_URL}/library/${id}`, {
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
      console.log('📚 Fetching books for room:', coupleId);

      const response = await fetch(`${BASE_URL}/library?coupleId=${coupleId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      console.log('📚 Get books response:', {
        status: response.status,
        ok: response.ok,
        data: result.data,
        error: result.error,
      });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch books');
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error fetching books:', {
        error,
        message: error.message,
        coupleId,
      });
      throw error;
    }
  },

  getBook: async (id: string): Promise<Book> => {
    try {
      const response = await fetch(`${BASE_URL}/library/${id}`, {
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

  deleteBook: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/library/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete book');
      }
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
