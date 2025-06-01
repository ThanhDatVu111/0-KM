import { Request, Response, NextFunction } from 'express';
import * as entriesService from '../services/entriesService';

export async function fetchEntries(
  req: Request<{ book_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { book_id } = req.params;

    if (!book_id) {
      res.status(400).json({ error: 'Missing required book_id parameter' });
      return;
    }

    const entries = await entriesService.fetchEntries({ book_id });

    res.status(200).json({ data: entries });
  } catch (err: any) {
    next(err);
  }
}

export async function createEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, book_id, title, body, location, pin, media, created_at } = req.body;

    // Validate required fields
    if (!book_id || !title) {
      res.status(400).json({ error: 'Missing required fields: book_id or title' });
      return;
    }

    const newEntry = await entriesService.createEntries({
      id,
      book_id,
      title,
      body,
      location,
      pin,
      media,
      created_at,
    });

    res.status(201).json({ data: newEntry });
  } catch (err: any) {
    next(err);
  }
}
