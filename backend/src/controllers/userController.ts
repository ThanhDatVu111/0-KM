import * as userService from '../services/userService';
import { Request, Response, NextFunction } from 'express';
import { SignUpBody, OnboardBody, FetchUserQuery } from '../types/users';

// Sign Up
export async function signUp(
  req: Request<{}, {}, SignUpBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, user_id } = req.body;

    if (!email || !user_id) {
      res.status(400).json({ error: 'Missing required fields for signup' });
      return;
    }

    const newUser = await userService.registerUser({ email, user_id });
    res.status(201).json({ data: newUser });
  } catch (err: any) {
    next(err);
  }
}

// Onboard
export async function onboard(
  req: Request<{}, {}, OnboardBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id, name, birthdate, photo_url } = req.body;

    if (!user_id || !name || !birthdate || !photo_url) {
      res.status(400).json({ error: 'Missing required fields for onboarding' });
      return;
    }

    const updatedUser = await userService.onboardUser({
      user_id,
      username: name,
      birthdate,
      photo_url,
    });

    res.status(201).json({ data: updatedUser });
  } catch (err: any) {
    next(err);
  }
}

// Fetch User
export async function fetchUser(
  req: Request<{ userId: string }, {}, {}, FetchUserQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'Missing required userId to fetch user' });
      return;
    }

    const user = await userService.fetchUser({ userId });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ data: user });
  } catch (err: any) {
    next(err);
  }
}
