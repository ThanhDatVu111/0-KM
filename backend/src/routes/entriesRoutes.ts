// src/routes/entriesRouter.ts
import { Router } from 'express';
import multer from 'multer';
import {
  createEntries,
  deleteEntries,
  fetchEntries,
  updateEntries,
} from '../controllers/entriesController';

const router = Router();

router.get('/:book_id', fetchEntries);
router.post('/:book_id', createEntries);
router.delete('/:book_id/:entry_id', deleteEntries);
router.put('/:book_id/:entry_id', updateEntries);

export default router;