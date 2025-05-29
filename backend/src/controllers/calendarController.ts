import { error } from 'console';
import * as calendarServices from '../services/calendarService';

export async function createCalendar(req: any, res: any) {
  try {
    if (!req.body.room_id || !req.body.user_1) {
      return res.status(400).json({ error: 'missing required fields' });
    }
    const response = await calendarServices.registerCalendar(req.body);

    if (!response.ok) {
      return res.status(400).json({ error: 'error creating calendar' });
    }
    res.status(201).json({ data: response });
  } catch (error) {
    console.error('error creating calendar: ', error);
  }
}

export async function checkCalendar(req: any, res: any) {
  try {
    if (!req.body.room_id) {
      return res.status(400).json({ error: 'missing required field (room_id)' });
    }

    const response = await calendarServices.checkCalendar(req.body);

    if (!response) {
      return res.status(400).json({ error: 'cannot check room' });
    }

    res.status(200).json({ data: response });
  } catch (error) {
    console.error('error checking calendar: ', error);
  }
}

export async function checkCalendarFilled(req: any, res: any) {
  try {
    if (!req.body.room_id) {
      return res.status(400).json({ error: 'missing required fields' });
    }

    const response = calendarServices.checkCalendarFilled(req.body);

    if (!response) {
      return res.status(400).json({ error: 'cannot check if room filled or not' });
    }

    res.status(400).json({ data: response });
  } catch (error) {
    console.error('error checking calendar filled: ', error);
  }
}
