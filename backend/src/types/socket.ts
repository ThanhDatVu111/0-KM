import { User } from '@supabase/supabase-js';
import { Socket, Server } from 'socket.io';

export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

export interface ClientToServerEvents {
  hello: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}

export interface SocketConnectedUsers {
  [key: string]: {
    socketId: string;
    socket: Socket;
    user: User;
  };
}

export interface SocketSocketIdUserId {
  [key: string]: string;
}

export function registerSocketHandlers(io: Server) {
  console.log('Socket handlers called');
  io.on('connection', (socket) => {
    const user_id = socket.handshake.auth.user_id || socket.handshake.query.user_id;
    console.log(`User connected with ID: ${user_id}`);

    if (user_id) {
      socket.join(user_id); // join their personal chatroom
    }
  });
}
