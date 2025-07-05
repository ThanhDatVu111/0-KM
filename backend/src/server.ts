import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from '../supabase/db';
import UserRouter from './routes/userRoutes';
import RoomRouter from './routes/roomRoutes';
import LibraryRouter from './routes/libraryRoutes';
// import other routers like TripRouter, NotificationRouter if needed

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const LOCAL_URL = process.env.LOCAL_URL;
const PUBLIC_URL = process.env.PUBLIC_URL;

app.use(express.json({ limit: '20mb' })); // For JSON payloads
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());

// Route mounting
app.use('/users', UserRouter);
app.use('/rooms', RoomRouter);
app.use('/library', LibraryRouter);

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
    if (!PORT) {
      throw new Error('🚨 PORT is not defined or invalid.');
    }
    app.listen(PORT, '0.0.0.0', () => {
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
