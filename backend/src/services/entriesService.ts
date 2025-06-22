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
  media_paths: string[];
  created_at: string;
}) {
  try {
    const entry = await entriesModel.insertEntries(input);
    return entry;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error in entriesService createEntries:', error.message);
    } else {
      console.error('❌ Unknown error in entriesService createEntries:', error);
    }
    throw error;
  }
}

export async function deleteEntries(input: { book_id: string; entry_id: string }): Promise<void> {
  try {
    await entriesModel.deleteEntries(input.book_id, input.entry_id);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error in entriesService deleteEntry:', error.message);
    } else {
      console.error('❌ Unknown error in entriesService deleteEntry:', error);
    }
    throw error;
  }
}

export async function updateEntries(input: {
  id: string;
  book_id: string;
  title: string;
  body?: string | null;
  location?: object | null;
  media_paths: string[];
  updated_at: string;
}) {
  try {
    const updatedEntry = await entriesModel.updateEntries(input);
    return updatedEntry;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error in entriesModel updateEntries:', error.message);
    } else {
      console.error('❌ Unknown error in entriesModel updateEntries:', error);
    }
    throw error;
  }
}