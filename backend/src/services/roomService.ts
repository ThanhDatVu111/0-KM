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

export async function deleteRoom(input: any) {
  return roomModel.deleteRoom({
    room_id: input.room_id,
  });
}
