import { error } from 'console';
import * as calendarService from '../services/calendarService';
import { use } from 'react';

export async function checkRefreshToken(req: any, res: any) {
  try {
    const user_id = req.query.user_id;
    if (!user_id) {
      return res.status(400).json({ error: 'Missing required field: user_id' });
    }

    const hasToken = await calendarService.checkRefreshToken({ user_id });

    return res.status(200).json({ hasToken });
  } catch (err) {
    console.error('Error in checkRefreshToken:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateRefreshToken(req: any, res: any) {
  try {
    if (!req.body.user_id || !req.body.refresh_token) {
      return res.status(400).json({ error: 'missing required fields to update refresh token' });
    }
    const response = await calendarService.updateRefreshToken(req.body);
    if (!response) {
      return res.status(400).json({ error: '(in) error while updating refresh token' });
    }
    res.status(200).json({ data: response });
  } catch (error) {
    return res.status(400).json({ error: '(out) error while updating refresh token' });
  }
}

export async function fetchRefreshToken(req: any, res: any) {
  try {
    const user_id = req.query.user_id;
    const response = await calendarService.fetchRefreshToken({ user_id });
    if (!response) {
      return res.status(400).json({ error: 'error fetching refresh token' });
    }
    res.status(200).json({ data: response });
  } catch (error) {
    return res.status(400).json({ error: 'error fetching refresh token' });
  }
}

export async function createEvent(req: any, res: any) {
  try {
    const response = await calendarService.createEvent({
      room_id: req.body.room_id,
      user_1: req.body.user_1,
      user_2: req.body.user_2,
      start_time: req.body.start_time,
      start_timezone: req.body.start_timezone,
      end_time: req.body.end_time,
      end_timezone: req.body.end_timezone,
      title: req.body.title,
    });

    if (!response) {
      return res.status(400).json({ error: 'error creating event' });
    }
    res.status(200).json({ data: response });
  } catch (error) {
    return res.status(400).json({ error: 'error creating event' });
  }
}
