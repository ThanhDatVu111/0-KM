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
    const { user_id, username, birthdate, photo_url } = req.body;

    if (!user_id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    if (!username) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!birthdate) {
      res.status(400).json({ error: 'Missing birthdate' });
      return;
    }
    if (!photo_url) {
      res.status(400).json({ error: 'Missing photo' });
      return;
    }

    const updatedUser = await userService.onboardUser({
      user_id,
      username: username,
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
    res.status(200).json({ data: user });
  } catch (err: any) {
    next(err);
  }
}
