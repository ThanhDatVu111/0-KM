import * as entriesModel from '../models/entriesModel';

// Service function to fetch entries by book_id
export async function fetchEntries(input: { book_id: string }) {
  try {
    // Call the model function to fetch entries from the database
    const entries = await entriesModel.getEntries(input.book_id);
    return entries;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error in entriesModel fetchEntries:', error.message);
    } else {
      console.error('❌ Unknown error in entriesModel fetchEntries:', error);
    }
    throw error;
  }
}

export async function createEntries(input: {
  id: string;
  book_id: string;
  title: string;
  body?: string | null;
  location?: object | null;
  pin: boolean;
  media: object[];
  created_at: string;
}) {
  try {
    const entry = await entriesModel.insertEntries(input);
    return entry;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error in entriesModel createEntries:', error.message);
    } else {
      console.error('❌ Unknown error in entriesModel createEntries:', error);
    }
    throw error;
  }
}