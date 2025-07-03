import { Request, Response } from 'express';
import * as libraryModel from '../models/libraryModel';

export async function createBook(req: Request, res: Response) {
  try {
    const book = await libraryModel.createBook(req.body);
    res.json({ data: book });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateBook(req: Request, res: Response) {
  try {
    const book = await libraryModel.updateBook(req.params.id, req.body);
    res.json({ data: book });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getBooks(req: Request, res: Response) {
  try {
    const coupleId = req.query.coupleId as string;

    if (!coupleId) {
      console.error('❌ Missing coupleId in request:', req.query);
      res.status(400).json({ error: 'Missing required coupleId parameter' });
      return;
    }
    const books = await libraryModel.getBooks(coupleId);
    res.json({ data: books });
  } catch (error: any) {
    console.error('❌ Error in getBooks:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function getBook(req: Request, res: Response) {
  try {
    const book = await libraryModel.getBook(req.params.id);
    res.json({ data: book });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteBook(req: Request, res: Response) {
  try {
    await libraryModel.deleteBook(req.params.id);
    res.json({ message: 'Book deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
