import { error } from 'console';
import * as calendarService from '../services/calendarService';

export async function checkRefreshToken(req: any, res: any) {
  try {
    if (!req.body.user_id) {
      return res.status(400).json({ error: 'missing required fields to check refresh token' });
    }
    const response = await calendarService.checkRefreshToken(req.body);
    if (!response) {
      return res.status(400).json({ error: 'error checking refresh token' });
    }
    res.status(200).json({ data: response });
  } catch (error) {
    return res.status(400).json({ error: 'error checking refresh token' });
  }
}

export async function updateRefreshToken(req: any, res: any) {
  try {
    if (!req.body.user_id || !req.body.refresh_token) {
      return res.status(400).json({ error: 'missing required fields to update refresh token' });
    }
    const response = await calendarService.updateRefreshToken(req.body);
    if (!response.ok) {
      return res.status(400).json({ error: 'error while updating refresh token' });
    }
    res.status(200).json({ data: response });
  } catch (error) {
    return res.status(400).json({ error: 'error while updating refresh token' });
  }
}

export async function fetchRefreshToken(req: any, res: any) {
  try {
    if (!req.body.user_id) {
      return res.status(400).json({ error: 'missing required fields' });
    }
    const response = await calendarService.fetchRefreshToken(req.body);
    if (!response.ok) {
      return res.status(400).json({ error: 'error fetching refresh token' });
    }
    res.status(200).json({ data: response });
  } catch (error) {
    return res.status(400).json({ error: 'error fetching refresh token' });
  }
}
