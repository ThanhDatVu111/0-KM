import { Router } from 'express';
import { createEntries, fetchEntries } from '../controllers/entriesController';

const router = Router();

router.get('/:book_id', fetchEntries); // Route to fetch entries by book_id
router.post('/:book_id', createEntries); // Create a new entry

export default router;
