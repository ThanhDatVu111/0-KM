import { Router } from 'express';
import { createEntries, deleteEntries, fetchEntries, updateEntries } from '../controllers/entriesController';

const router = Router();

router.get('/:book_id', fetchEntries); // Route to fetch entries by book_id
router.post('/:book_id', createEntries); // Create a new entry
router.delete('/:book_id/:entry_id', deleteEntries); // delete an entry
router.put('/:book_id/:entry_id', updateEntries); 

export default router;
