export interface CreateRoomBody {
  room_id: string;
  user_1: string;
}

export interface CheckRoomBody {
  room_id: string;
}

export interface JoinRoomBody {
  room_id: string;
  user_id: string;
}

export interface DeleteRoomParams {
  room_id: string;
}