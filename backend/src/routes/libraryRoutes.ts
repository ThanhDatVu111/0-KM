import express from 'express';
import * as libraryController from '../controllers/libraryController';

const router = express.Router();

router.post('/', libraryController.createBook);
router.put('/:id', libraryController.updateBook);
router.get('/', libraryController.getBooks);
router.get('/:id', libraryController.getBook);
router.delete('/:id', libraryController.deleteBook);

export default router;
