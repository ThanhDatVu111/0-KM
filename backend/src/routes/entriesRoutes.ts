// src/routes/entriesRouter.ts
import { Router } from 'express';
import multer from 'multer';
import {
  createEntries,
  deleteEntries,
  fetchEntries,
  updateEntries,
} from '../controllers/entriesController';

const upload = multer({ storage: multer.memoryStorage() });
// Multer prepares the req.files array so the controller (e.g., createEntries or updateEntries) 
// can process the uploaded files and handle the logic for uploading them to S3.
const router = Router();

router.get('/:book_id', fetchEntries);

router.post('/:book_id', upload.array('mediaFiles', 16), createEntries);

router.delete('/:book_id/:entry_id', deleteEntries);

router.put('/:book_id/:entry_id', upload.array('mediaFiles', 16), updateEntries);

export default router;