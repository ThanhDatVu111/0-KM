import { Server } from 'socket.io';
import { Message } from './chat';
import { User, SocketConnectedUsers, SocketSocketIdUserId } from './users';

class Socket {
  private static _instance: Socket;

  private io;
  private users: SocketConnectedUsers = {};
  private socketIdUserId: SocketSocketIdUserId = {};

  private constructor(server: Server) {
    this.io = server;

    this.io.on('connection', (socket) => {
      console.log('User connected');

      // Update user information upon "join" event
      socket.on('join', (user: User) => {
        this.users[user.user_id] = {
          socketId: socket.id,
          socket: socket,
          user_id: user.user_id,
        };

        this.socketIdUserId[socket.id] = user.user_id;
      });

      // Delete user information when users go offline to not overload memory
      socket.on('disconnect', () => {
        const userId = this.socketIdUserId[socket.id];

        if (userId) {
          delete this.users[userId];
          delete this.socketIdUserId[socket.id];
        }
      });
    });
  }

  static getInstance(server?: Server) {
    if (this._instance) {
      return this._instance;
    }

    if (server) {
      this._instance = new Socket(server);
      return this._instance;
    }

    return Error('Failed to init socket');
  }
}

export default Socket;
