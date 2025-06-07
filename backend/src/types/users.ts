import { Socket } from "socket.io";

export interface User {
  email: string;
  user_id: string;
  username?: string;
  birthdate?: string;
  photo_url?: string;
  created_at: string;
}

export interface SocketConnectedUsers {
  [key: string]: {
    socketId: string;
    socket: Socket;
    user_id: string;
  };
}

export interface SocketSocketIdUserId {
  [key: string]: string;
}

export interface SignUpBody {
  email: string;
  user_id: string;
}

export interface OnboardBody {
  user_id: string;
  name: string;
  birthdate: string;
  photo_url: string;
}

export interface FetchUserQuery {
  userId: string;
}


