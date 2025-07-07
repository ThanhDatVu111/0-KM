import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import UserRouter from './routes/userRoutes';
import RoomRouter from './routes/roomRoutes';
import LibraryRouter from './routes/libraryRoutes';
import EntriesRouter from './routes/entriesRoutes';
import { v2 as cloudinary } from 'cloudinary';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as Y from 'yjs';

dotenv.config();

const app = express();
const httpServer = http.createServer(app); //Lets backend serve HTTP routes + WebSocket (real-time) on the same server.
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const LOCAL_URL = process.env.LOCAL_URL;
const PUBLIC_URL = process.env.PUBLIC_URL;

app.use(express.json({ limit: '20mb' })); // For JSON payloads
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(
  cors({
    origin: [LOCAL_URL, PUBLIC_URL].filter((u): u is string => !!u),
  }),
);

// Route mounting
app.use('/users', UserRouter);
app.use('/rooms', RoomRouter);
app.use('/library', LibraryRouter);
app.use('/entries', EntriesRouter);
app.get('/cloudinary-sign', (_req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET!,
  );
  res.json({ signature, timestamp });
});

const startServer = () => {
  try {
    if (!PORT) {
      throw new Error('🚨 PORT is not defined or invalid.');
    }
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Server listening on port', PORT);
      console.log('✅ Local endpoint:', LOCAL_URL);
      console.log('✅ Public endpoint:', PUBLIC_URL);
    });
  } catch (err: any) {
    console.error('🚨 Failed to start server:', err.message || err);
    process.exit(1);
  }
};
startServer();
