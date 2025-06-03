export interface RoomRequest {
  room_id: string;
  user_1: string;
}

export interface CreatedRoom {
  room_id: string;
  user_1: string;
  user_2: string;
  created_at: string;
}

export interface PairRequest {
  room_id: string;
  user_2: string;
}

export interface DeleteRoomRequest {
  room_id: string;
}

export interface FetchRoomRequest {
  user_id: string;
}

export interface FetchRoomResponse {
  filled: boolean;
}

export interface FetchRoomByUserIdRequest {
  user_id: string;
}

export interface FetchRoomByUserIdResponse {
  room_id: string;
  other_user_id: string;
}