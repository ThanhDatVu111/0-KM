import { Router } from 'express';
import { onboard, signUp, fetchUser } from '../controllers/userController';

const router = Router();

// Define routes
router.post('/', signUp); 
router.put('/:userId', onboard); 
router.get('/:userId', fetchUser); 

export default router;