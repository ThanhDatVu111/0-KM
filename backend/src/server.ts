import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import supabase from '../utils/supabase';
import UserRouter from './routes/userRoutes';
import RoomRouter from './routes/roomRoutes';
import LibraryRouter from './routes/libraryRoutes';
import ChatRouter from './routes/chatRoutes';
import socketHandler from './socket';
import { v2 as cloudinary } from 'cloudinary';
// import other routers like TripRouter, NotificationRouter if needed

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const LOCAL_URL = process.env.LOCAL_URL;
const PUBLIC_URL = process.env.PUBLIC_URL;
const io = new Server(server, {
  cors: {
    origin: [process.env.LOCAL_URL, process.env.PUBLIC_URL].filter((u): u is string => !!u),
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['websocket', 'polling'], // Allow both WebSocket and polling for ngrok compatibility
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000, // Increase ping timeout for ngrok
  pingInterval: 25000, // Increase ping interval for ngrok
});

app.use(express.json({ limit: '20mb' })); // For JSON payloads
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(
  cors({
    origin: [LOCAL_URL, PUBLIC_URL].filter((u): u is string => !!u),
    credentials: true,
  }),
);
app.get('/cloudinary-sign', (_req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET!,
  );
  res.json({ signature, timestamp });
});

// Route mounting
app.use('/users', UserRouter);
app.use('/rooms', RoomRouter);
app.use('/library', LibraryRouter);
app.use('/chat', ChatRouter);

// Initialize Socket.IO
socketHandler(io);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 Server error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

const startServer = async () => {
  try {
    console.log('🔍 Checking Supabase connectivity...');

    // 1) Quick "head"‐only check on your users table
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
    if (!PORT) {
      throw new Error('🚨 PORT is not defined or invalid.');
    }
    server.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Server listening on port', PORT);
      console.log('✅ Local endpoint:', LOCAL_URL);
      console.log('✅ Public endpoint:', PUBLIC_URL);
      console.log('✅ Socket.IO server initialized');
      console.log('✅ Ngrok-compatible WebSocket configuration active');
    });
  } catch (err: any) {
    console.error('🚨 Failed to start server:', err.message || err);
    process.exit(1);
  }
};

startServer();
