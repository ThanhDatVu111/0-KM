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
    const { room_id, user_id } = req.body;

    if (!room_id || !user_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const exists = await roomService.checkRoom({ room_id });
    if (!exists) {
      res.status(404).json({ error: '(join) room not found' });
      return;
    }

    await roomService.joinRoom({ room_id, user_id });
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

export async function updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { room_id } = req.params;
    const { user_id } = req.body;
    if (!room_id || !user_id) {
      res.status(400).json({ error: 'Missing room_id or user_id' });
      return;
    }
    const updatedRoom = await roomService.updateRoom(room_id, user_id);
    res.json({ data: updatedRoom });
  } catch (err) {
    next(err);
  }
}

// Update Playback State
export async function updatePlaybackState(
  req: Request<{ room_id: string }, {}, { playback_state: any; user_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id } = req.params;
    const { playback_state, user_id } = req.body;

    if (!room_id || !playback_state || !user_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Get the current playback state to compare
    const currentPlaybackState = await roomService.getPlaybackState(room_id);

    // Only change the controller when a new track is added, not on play/pause
    const isTrackChange =
      playback_state.current_track_uri &&
      (!currentPlaybackState?.current_track_uri ||
        playback_state.current_track_uri !== currentPlaybackState.current_track_uri);

    const updatedPlaybackState = {
      ...playback_state,
      // Only set controller if this is a track change, otherwise keep existing controller
      controlled_by_user_id: isTrackChange ? user_id : currentPlaybackState?.controlled_by_user_id,
    };

    const result = await roomService.updatePlaybackState(room_id, updatedPlaybackState);
    res.json({ data: result });
  } catch (err: any) {
    next(err);
  }
}

// Get Playback State
export async function getPlaybackState(
  req: Request<{ room_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id } = req.params;

    if (!room_id) {
      res.status(400).json({ error: 'Missing room_id parameter' });
      return;
    }

    const playbackState = await roomService.getPlaybackState(room_id);
    res.json({ data: playbackState });
  } catch (err: any) {
    next(err);
  }
}
