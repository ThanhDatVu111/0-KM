export interface SignUpBody {
  email: string;
  user_id: string;
}

export interface OnboardBody {
  user_id: string;
  name: string;
  birthdate: string;
  photo_url: string;
  timezone?: string;
  location_latitude?: number;
  location_longitude?: number;
  location_city?: string;
  location_country?: string;
  anniversary_date?: string;
}

export interface FetchUserQuery {
  userId: string;
}
