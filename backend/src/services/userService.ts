import * as userModel from '../models/userModel';

//ROLE: This file is responsible for the business logic of the user service.

export async function registerUser(input: any) {
  //Receive “raw” data from the controller and pass it to the model
  return userModel.createUser({
    email: input.email,
    user_id: input.user_id,
  });
}
export function onboardUser(input: any) {
  return userModel.updateUser({
    user_id: input.user_id,
    username: input.name,
    birthdate: input.birthdate,
    photo_url: input.photo_url
  });
}

export function fetchUser(input: any) {
  return userModel.getUser(input.userId);
}