import { Server } from 'socket.io';

export default function socketHandler(io: Server) {
  console.log('Socket Handler called');
  io.on('connection', (socket) => {
    const user_socket_id = socket.handshake.auth.userId;
    if (!user_socket_id) {
      console.log('User not found');
      return;
    }

    // Emit "join" after connection
    socket.on('socket', () => {
      console.log('Established socket connection');
      socket.emit('join', user_socket_id); // triggers backend log
    });

    // Join chat
    socket.on('join-chat', (room_id) => {
      socket.join(room_id);
      console.log(`Socket ${socket.id} joined ${room_id}`);
    });

    // Send message
    socket.on('send-message', async (message) => {
      io.to(message.room_id).emit('receive-message', message);
    });

    // Clean up on disconnect
    socket.on('disconnect', async () => {
      try {
      } catch (err: any) {
        console.error('❌ disconnect cleanup error:', err.message);
      }
    });
  });
}
