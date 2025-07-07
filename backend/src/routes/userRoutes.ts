import { Router } from 'express';
import { onboard, signUp, fetchUser, updateProfile } from '../controllers/userController';

const router = Router();

// Define routes
router.post('/', signUp);
router.put('/:userId', onboard);
router.get('/:userId', fetchUser);
router.patch('/:userId', updateProfile);

export default router;
