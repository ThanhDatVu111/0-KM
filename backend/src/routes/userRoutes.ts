import { Router } from 'express';
import { onboard, signUp, fetchUser } from '../controllers/userController';

//Role: API route for user-related operations

const router = Router();

//This defines a POST route for / within the UserRouter, which corresponds to /user in the full URL.
router.post('/signup', signUp); 
router.put('/onboard', onboard); 
router.get('/fetch', fetchUser); 

export default router;
