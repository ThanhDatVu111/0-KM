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

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [LOCAL_URL, PUBLIC_URL].filter((u): u is string => !!u),
    methods: ['GET', 'POST'],
  },
});

// Shared Yjs document for real-time editing
const docs = new Map<string, Y.Doc>();

// In your backend server.ts, add awareness logic for Socket.IO
type AwarenessState = {
  entryId: string;
  userId: string;
  name: string;
  color: string;
  field: string | null;
  caret: number | null;
};

const awarenessStates = new Map<string, AwarenessState[]>();

io.on('connection', (socket) => {
  socket.on('join-entry', (entryId: string, initialTitle?: string, initialBody?: string) => {
    console.log('✅ A client joined entry', entryId);
    socket.join(entryId);

    // If this is a new doc, seed with initial values if provided
    if (!docs.has(entryId)) {
      const ydoc = new Y.Doc();
      if (initialTitle) {
        ydoc.getText('entry-title').insert(0, initialTitle);
      }
      if (initialBody) {
        ydoc.getText('entry-body').insert(0, initialBody);
      }
      docs.set(entryId, ydoc);
    }

    const ydoc = docs.get(entryId)!;

    // Send current doc to client
    const state = Y.encodeStateAsUpdate(ydoc);
    socket.emit('yjs-initial-state', state);

    // Listen for updates
    socket.on('yjs-update', (update: Uint8Array) => {
      Y.applyUpdate(ydoc, update);
      // Only broadcast to others in the same entry
      socket.to(entryId).emit('yjs-update', update);
    });

    // Respond to explicit initial state requests
    socket.on('request-initial-state', (entryId: string) => {
      const ydoc = docs.get(entryId)!;
      const state = Y.encodeStateAsUpdate(ydoc);
      socket.emit('yjs-initial-state', state);
    });

    // Add awareness state for this user
    socket.on('awareness-update', (state: AwarenessState) => {
      let states = awarenessStates.get(entryId) || [];
      // Remove any previous state for this user
      states = states.filter((s) => s.userId !== state.userId);
      states.push(state);
      awarenessStates.set(entryId, states);
      // Broadcast to all in room
      io.to(entryId).emit('awareness-states', states);
    });
    
    socket.on('disconnect', () => {
      // Remove awareness state for this user
      let states = awarenessStates.get(entryId) || [];
      states = states.filter((s) => s.userId !== socket.id);
      awarenessStates.set(entryId, states);
      io.to(entryId).emit('awareness-states', states);
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ A client disconnected');
  });
});

const startServer = () => {
  try {
    if (!PORT) {
      throw new Error('🚨 PORT is not defined or invalid.');
    }
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Server with Socket.IO listening on port', PORT);
      console.log('✅ Local endpoint:', LOCAL_URL);
      console.log('✅ Public endpoint:', PUBLIC_URL);
    });
  } catch (err: any) {
    console.error('🚨 Failed to start server:', err.message || err);
    process.exit(1);
  }
};
startServer();
