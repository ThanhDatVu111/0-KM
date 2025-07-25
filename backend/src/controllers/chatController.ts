import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chatService';

export async function fetchMessages(
  req: Request<{
    room_id: string;
    pageParam?: number;
  }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id, pageParam } = req.query;
    const page = parseInt((pageParam as string) || '0', 10);

    if (!room_id) {
      res.status(400).json({ error: 'Missing field/params: room_id' });
      return;
    }

    const prevMessage = await chatService.fetchMessages({
      room_id: room_id as string,
      pageParam: page,
    });
    res.status(200).json({ data: prevMessage });
  } catch (err: any) {
    next(err);
  }
}

export async function getMessageById(
  req: Request<{ message_id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { message_id } = req.params;
    if (!message_id) {
      res.status(400).json({ error: 'Missing field/params: message_id' });
      return;
    }

    const message = await chatService.getMessageById(message_id);
    res.status(200).json({ data: message });
  } catch (err: any) {
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      message_id,
      room_id,
      content,
      sender_id,
      created_at,
      media_paths,
      is_sent,
      is_read,
      is_edited,
      reaction,
    } = req.body;
    if (!room_id || (!content && !media_paths)) {
      res.status(400).json({ error: 'Missing field/params: room_id or content or media_paths' });
      return;
    }

    const newMessage = await chatService.sendMessage({
      message_id,
      room_id,
      content,
      sender_id,
      created_at,
      media_paths,
      is_sent,
      is_read,
      is_edited,
      reaction,
    });
  } catch (err: any) {
    next(err);
  }
}

export async function editMessage(
  req: Request<{ message_id: string; newInput: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { message_id, newInput } = req.params;

    if (!message_id || !newInput) {
      res.status(400).json({ error: 'RMissing field/params: message_id or newInput' });
      return;
    }
    const newMessage = await chatService.editMessage({ message_id, newInput });
    res.status(200).json({ data: newMessage });
  } catch (err: any) {
    next(err);
  }
}

export async function deleteMessage(
  req: Request<{ message_id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { message_id } = req.params;
    if (!message_id) {
      res.status(400).json({ error: 'RMissing field/params: message_id' });
      return;
    }
    await chatService.deleteMessage(message_id);
  } catch (err: any) {
    next(err);
  }
}
