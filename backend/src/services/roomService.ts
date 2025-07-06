import * as roomModel from '../models/roomModel';

//ROLE: This file is responsible for the business logic of the user service.

export async function registerRoom(input: any) {
  //Receive “raw” data from the controller and pass it to the model
  return roomModel.createRoom({
    room_id: input.room_id,
    user_1: input.user_1,
  });
}

export async function joinRoom(input: any) {
  return roomModel.joinRoom({
    room_id: input.room_id,
    user_2: input.user_2,
  });
}

export async function checkRoom(input: any) {
  return roomModel.checkRoom({
    room_id: input.room_id,
  });
}

export async function deleteRoom(input: any) {
  return roomModel.deleteRoom({
    room_id: input.room_id,
  });
}

export async function fetchRoom(user_id: string) {
  return roomModel.fetchRoom(user_id);
}

export async function updateRoom(room_id: string, user_id: string) {
  console.log('updateRoom called with:', { room_id, user_id });
  // Fetch the room to determine which user slot to clear
  const room = await roomModel.getRoomById(room_id);
  if (!room) throw new Error('Room not found');
  let updates: any = {};
  // Determine which user slot to clear based on user_id
  if (room.user_1 === user_id) {
    updates = { user_1: null, filled: false };
  } else if (room.user_2 === user_id) {
    updates = { user_2: null, filled: false };
  } else {
    throw new Error('User not in this room');
  }
  console.log('Room update payload:', updates);
  return roomModel.updateRoom(room_id, updates);
}
