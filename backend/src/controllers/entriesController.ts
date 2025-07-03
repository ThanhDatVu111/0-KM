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

export async function createEntries(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, book_id, title, body, location, pin, media_paths, created_at } = req.body;

    // Validate required fields
    if (!book_id || !title || !media_paths) {
      res.status(400).json({ error: 'Missing required fields: book_id or title or media_paths' });
      return;
    }

    const newEntry = await entriesService.createEntries({
      id,
      book_id,
      title,
      body,
      location,
      pin,
      media_paths,
      created_at,
    });

    res.status(201).json({ data: newEntry });
  } catch (err: any) {
    next(err);
  }
}

export async function deleteEntries(
  req: Request<{ book_id: string; entry_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { book_id, entry_id } = req.params;

    if (!book_id || !entry_id) {
      res
        .status(400)
        .json({ error: 'Missing required parameters: book_id or entry_id in entriesController' });
      return;
    }

    await entriesService.deleteEntries({ book_id, entry_id });

    res.status(204).send(); // No content response
  } catch (err: any) {
    next(err);
  }
}

export async function updateEntries(
  req: Request<{ book_id: string; entry_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { book_id, entry_id } = req.params;
    const { title, body, location, pin, media_paths, updated_at } = req.body;

    // Validate required fields
    if (!book_id || !entry_id || !title) {
      res.status(400).json({ error: 'Missing required fields: book_id, entry_id, or title' });
      return;
    }

    const updatedEntry = await entriesService.updateEntries({
      id: entry_id,
      book_id,
      title,
      body,
      location,
      media_paths,
      updated_at,
    });

    res.status(200).json({ data: updatedEntry });
  } catch (err: any) {
    next(err);
  }
}
