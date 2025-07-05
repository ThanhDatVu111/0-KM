import * as calendarModel from '../models/calendarModel';

export async function checkRefreshToken(input: any) {
  return calendarModel.checkRefreshToken({
    user_id: input.user_id,
  });
}

export async function updateRefreshToken(input: any) {
  return calendarModel.updateToken({
    user_id: input.user_id,
    refresh_token: input.refresh_token,
  });
}

export async function fetchRefreshToken(input: any) {
  return calendarModel.fetchRefreshToken({
    user_id: input.user_id,
  });
}

export async function createEvent(input: any) {
  return calendarModel.createEvent({
    room_id: input.room_id,
    user_1: input.user_1,
    user_2: input.user_2,
    start: { dateTime: input.start_time, timeZone: input.start_timezone },
    end: { dateTime: input.end_time, timeZone: input.end_timezone },
    title: input.title,
  });
}
