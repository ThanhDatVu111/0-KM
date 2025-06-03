import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chatService';

export async function createChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { room_id, user_1, user_2 } = req.body;
    if (!room_id || !user_1 || !user_2) {
      res
        .status(400)
        .json({ error: 'Missing fields/params: room_id and/or user_1 ID and/or user_2 ID' });
      return;
    }
    const newChat = await chatService.createChat({
      room_id,
      user_1,
      user_2,
    });
    res.status(201).json({ data: newChat });
  } catch (err: any) {
    next(err);
  }
}

export async function fetchMessages(
  req: Request<{
    room_id: string;
    pageParam?: number;
  }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { room_id } = req.params;
    if (!room_id) {
      res.status(400).json({ error: 'Missing field/params: room_id' });
      return;
    }

    const prevMessage = await chatService.fetchMessages({ room_id });
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
      res.status(400).json({ error: 'RMissing field/params: message_id' });
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
    const { message_id, room_id, content, sent_by, created_at } = req.body;
    if (!room_id || !content) {
      res.status(400).json({ error: 'RMissing field/params: room_id and content' });
      return;
    }

    const newMessage = await chatService.sendMessage({
      message_id,
      room_id,
      content,
      sent_by,
      created_at,
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
      res.status(400).json({ error: 'RMissing field/params: message_id and newInput' });
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
