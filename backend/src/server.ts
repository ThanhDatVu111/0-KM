import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import supabase from '../supabase/db';
import UserRouter from './routes/userRoutes';
import RoomRouter from './routes/roomRoutes';
import ChatRouter from './routes/chatRoutes';
import Socket from './types/socket';
// import other routers like TripRouter, NotificationRouter if needed

dotenv.config();

const app = express();
const server = createServer(app);

const PORT = process.env.PORT;
const LOCAL_HOST_URL = process.env.LOCAL_HOST_URL;

const io = new Server(server, {
  cors: {
    origin: `${LOCAL_HOST_URL}:${PORT}`,
    methods: ['GET', 'POST'],
  },
});

app.use(express.json({ limit: '20mb' })); // For JSON payloads
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors()); // allows the backend to respond to requests from the frontend.

// Route mounting
app.use('/users', UserRouter);
app.use('/rooms', RoomRouter);
app.use('/chat', ChatRouter);

const startServer = async () => {
  try {
    console.log('🔍 Checking Supabase connectivity...');

    // 1) Quick “head”‐only check on your users table
    let { error } = await supabase.from('users').select('user_id', { head: true }).limit(1);

    if (error) {
      console.error('❌ Cannot read from users table:', error.message);
      return;
    }
    console.log('✅ users table reachable');

    // 2) Verify the exact columns you expect
    const expectedCols = [
      'user_id',
      'email',
      'username',
      'birthdate',
      'photo_url',
      'created_at',
    ].join(',');

    const { error: schemaErr } = await supabase
      .from('users')
      .select(expectedCols, { head: true })
      .limit(1);

    if (schemaErr) {
      console.error('❌ users schema check failed:', schemaErr.message);
      return;
    }
    console.log('✅ users schema and columns OK');

    // 4) All good—start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running at ${LOCAL_HOST_URL}:${PORT}`);
    });
  } catch (err: any) {
    console.error('🚨 Failed to start server:', err.message || err);
    process.exit(1);
  }
};

startServer();
