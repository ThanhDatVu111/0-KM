import * as roomModel from '../models/roomModel';

//ROLE: This file is responsible for the business logic of the user service.

export async function registerRoom(input: any) {
  //Receive “raw” data from the controller and pass it to the model
  return roomModel.createRoom({
    room_id: input.room_id,
    user_1: input.user_1,
  });
}

export async function joinRoom(input: { room_id: string; user_id: string }) {
  return roomModel.joinRoom(input);
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
  return roomModel.updateRoomForLeaving(room_id, user_id);
}

export async function getRoomById(room_id: string) {
  return roomModel.getRoomById(room_id);
}

export async function updatePlaybackState(room_id: string, playback_state: any) {
  return roomModel.updatePlaybackState(room_id, playback_state);
}

export async function getPlaybackState(room_id: string) {
  return roomModel.getPlaybackState(room_id);
}
