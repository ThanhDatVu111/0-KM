import { Book, CreateBookDTO, UpdateBookDTO } from '../types/library';
import { BASE_URL } from './apiClient';

console.log('BASE_URL:', BASE_URL);

export const libraryApi = {
  createBook: async (book: CreateBookDTO): Promise<Book> => {
    try {
      const response = await fetch(`${BASE_URL}/library`, {
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
      const response = await fetch(`${BASE_URL}/library?coupleId=${coupleId}`, {
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

      const result = await response.json();

      if (!response.ok) {
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
