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
  timezone?: string;
  location_latitude?: number;
  location_longitude?: number;
  location_city?: string;
  location_country?: string;
  anniversary_date?: string;
}

interface FetchUserInput {
  userId: string;
}

export async function registerUser(input: RegisterUserInput) {
  //Receive "raw" data from the controller and pass it to the model
  return userModel.createUser({
    email: input.email,
    user_id: input.user_id,
  });
}
export function onboardUser(input: OnboardUserInput) {
  return userModel.updateUserProfile({
    user_id: input.user_id,
    username: input.username,
    birthdate: input.birthdate,
    photo_url: input.photo_url,
    timezone: input.timezone,
    location_latitude: input.location_latitude,
    location_longitude: input.location_longitude,
    location_city: input.location_city,
    location_country: input.location_country,
    anniversary_date: input.anniversary_date,
  });
}

export function fetchUser(input: FetchUserInput) {
  return userModel.getUser(input.userId);
}

export function updateUserProfile(input: {
  user_id: string;
  username?: string;
  birthdate?: string;
  photo_url?: string;
  timezone?: string;
  location_latitude?: number;
  location_longitude?: number;
  location_city?: string;
  location_country?: string;
  anniversary_date?: string;
}) {
  return userModel.updateUserProfile(input);
}
