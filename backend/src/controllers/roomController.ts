import * as roomService from '../services/roomService';
import { Request, Response, NextFunction } from 'express';
import { PostgresErrorCodes } from '../constants/postgresErrorCodes';
import { CreateRoomBody, CheckRoomBody, JoinRoomBody, DeleteRoomParams } from '../types/rooms';

// Create Room
export async function createRoom(
  req: Request<{}, {}, CreateRoomBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id, user_1 } = req.body;

    if (!room_id || !user_1) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const room = await roomService.registerRoom({ room_id, user_1 });
    res.status(201).json({ data: room });
  } catch (err: any) {
    if (err.code === PostgresErrorCodes.UNIQUE_VIOLATION) {
      res.status(409).json({ error: 'Room already created' });
      return;
    }
    next(err);
  }
}

// Check Room
export async function checkRoom(
  req: Request<{}, {}, CheckRoomBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id } = req.body;

    if (!room_id) {
      res.status(400).json({ error: 'Missing room_id' });
      return;
    }

    const exists = await roomService.checkRoom({ room_id });
    res.json({ exists });
  } catch (err: any) {
    next(err);
  }
}

// Join Room
export async function joinRoom(
  req: Request<{}, {}, JoinRoomBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id, user_2 } = req.body;

    if (!room_id || !user_2) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const exists = await roomService.checkRoom({ room_id });
    if (!exists) {
      res.status(404).json({ error: '(join) room not found' });
      return;
    }

    await roomService.joinRoom({ room_id, user_2 });
    res.status(204).send();
  } catch (err: any) {
    next(err);
  }
}

// Delete Room
export async function deleteRoom(
  req: Request<DeleteRoomParams>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id } = req.params;

    if (!room_id) {
      res.status(400).json({ error: 'Missing required room_id parameter' });
      return;
    }

    const exists = await roomService.checkRoom({ room_id });
    if (!exists) {
      res.status(404).json({ error: '(delete) room not found' });
      return;
    }

    await roomService.deleteRoom({ room_id });
    res.status(204).send();
  } catch (err: any) {
    next(err);
  }
}

export async function fetchRoom(
  req: Request<{ user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'Missing required user_id parameter' });
      return;
    }

    const room = await roomService.fetchRoom(user_id);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Return all room data
    res.status(200).json({
      data: {
        room_id: room.room_id,
        user_1: room.user_1,
        user_2: room.user_2,
        filled: room.filled,
      },
    });
  } catch (err: any) {
    next(err);
  }
}
