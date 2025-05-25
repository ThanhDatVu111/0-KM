import * as userModel from '../models/userModel';

//ROLE: This file is responsible for the business logic of the user service.

interface RegisterUserInput {
  email: string;
  user_id: string;
}

interface OnboardUserInput {
  user_id: string;
  username: string;
  birthdate: string;
  photo_url: string;
}

interface FetchUserInput {
  userId: string;
}

export async function registerUser(input: RegisterUserInput) {
  //Receive “raw” data from the controller and pass it to the model
  return userModel.createUser({
    email: input.email,
    user_id: input.user_id,
  });
}
export function onboardUser(input: OnboardUserInput) {
  return userModel.updateUser({
    user_id: input.user_id,
    username: input.username,
    birthdate: input.birthdate,
    photo_url: input.photo_url,
  });
}

export function fetchUser(input: FetchUserInput) {
  return userModel.getUser(input.userId);
}