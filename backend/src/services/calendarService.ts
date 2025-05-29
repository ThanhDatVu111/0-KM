import { R } from '@clerk/clerk-react/dist/useAuth-CbDfW7Rs';
import * as calendarModel from '../models/calendarModel';

export async function registerCalendar(input: any) {
  return calendarModel.createCalendar({
    room_id: input.room_id,
    user_1: input.user_1,
  });
}

export async function checkCalendar(input: any) {
  return calendarModel.checkCalendar({
    room_id: input.room_id,
  });
}

export async function checkCalendarFilled(input: any) {
  return calendarModel.checkCalendarFilled({
    room_id: input.room_id,
  });
}
