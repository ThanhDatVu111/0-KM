import * as entriesModel from '../models/entriesModel';
import { uploadToCloudinary } from './cloudinaryService';

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
    console.log('media_paths in entriesService createEntries', input.media_paths);

    // Transform local media paths into Cloudinary URLs
    const cloudinaryUrls = await Promise.all(
      input.media_paths.map(async (localPath, index) => {
        const fileName = `${input.book_id}/${Date.now()}-${index}`; 
        const fileBuffer = await fetch(localPath).then((res) => res.arrayBuffer()); //currently bug at fetch here
        const cloudinaryUrl = await uploadToCloudinary(Buffer.from(fileBuffer), fileName); 
        return cloudinaryUrl; // Return the Cloudinary URL
      }),
    );

    console.log('cloudinaryUrls in entriesService createEntries', cloudinaryUrls);

    // Replace local media paths with Cloudinary URLs
    const transformedInput = {
      ...input,
      media_paths: cloudinaryUrls, // Use Cloudinary URLs
    };

    // Save the transformed entry to the database
    const entry = await entriesModel.insertEntries(transformedInput);
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
  media: object[];
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