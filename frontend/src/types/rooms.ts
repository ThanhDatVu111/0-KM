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
  room_id: string;
  filled: boolean;
<<<<<<< HEAD
  user_2: string;
=======
>>>>>>> f3d1c1f0819fd1e48b9bb466a45d50a52e62615e
}
