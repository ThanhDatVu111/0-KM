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
    const books = await libraryModel.getBooks(req.query.coupleId as string);
    res.json({ data: books });
  } catch (error: any) {
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
