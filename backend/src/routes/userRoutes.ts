import { Router } from 'express';
import { signUp } from '../controllers/userController';

//Role: API route for user-related operations

const router = Router();

//Route to handle user sign-up, direct to the signUp controller
router.post('/', signUp);

export default router;
