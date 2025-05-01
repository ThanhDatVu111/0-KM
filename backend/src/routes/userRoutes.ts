import { Router } from 'express';
import supabase from '../db';
const router = Router();

router.post('/', async (req: any, res: any) => {
  const { email, userId, name, birthdate, photo } = req.body;

  if (!email || !userId || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email: email,
        user_id: userId,
        username: name,
        birthdate: birthdate,
        photo_url: photo,
        created_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    console.error('❌ Supabase insert failed:', error.message);
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json({ message: '✅ User created', data });
});

export default router;
