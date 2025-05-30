export interface SignUpBody {
  email: string;
  user_id: string;
}

export interface OnboardBody {
  user_id: string;
  username: string;
  birthdate: string;
  photo_url: string;
}

export interface FetchUserQuery {
  userId: string;
}