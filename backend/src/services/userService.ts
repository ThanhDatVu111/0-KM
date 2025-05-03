import * as userModel from '../models/userModel';

//ROLE: This file is responsible for the business logic of the user service.

export async function registerUser(input: any) {
  //Receive “raw” data from the controller and pass it to the model
  return userModel.createUser({
    email: input.email,
    user_id: input.userId,
    username: input.name,
    birthdate: input.birthdate,
    photo_url: input.photo,
  });
}
