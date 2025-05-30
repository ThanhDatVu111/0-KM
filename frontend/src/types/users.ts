export interface UserRequest {
  email: string;
  user_id: string;
}

export interface CreatedUser {
  user_id: string;
  email: string;
  created_at: string;
}

export interface OnboardRequest {
  user_id: string;
  username: string;
  birthdate: string;
  photo_url?: string;
}

export interface OnboardResponse {
  username: string;
  birthdate: string;
  photo_url: string;
}

export interface FetchedUserResponse {
  email: string;
  user_id: string;
  username?: string;
  birthdate?: string;
  photo_url?: string;
  created_at: string;
}
