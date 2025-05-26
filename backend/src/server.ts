import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from '../supabase/db';
import UserRouter from './routes/userRoutes';
import RoomRouter from './routes/roomRoutes';
// import other routers like TripRouter, NotificationRouter if needed

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const LOCAL_HOST_URL = process.env.LOCAL_HOST_URL;

app.use(express.json({ limit: '20mb' })); // For JSON payloads
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors()); //allows the backend to respond to requests from the frontend.

//If the frontend makes a request to /user/..., go look in UserRouter to handle it.
app.use('/user', UserRouter);
app.use('/room', RoomRouter);

// ✅ Start server
const startServer = async () => {
  try {
    // If you want to test connection, you can add a Supabase health check here (optional)
    console.log('Checking Supabase connectivity...');
    // Test query to check connection
    const { error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed or users is not exist:', error.message);
      return;
    }
    app.listen(PORT, () => {
      console.log(`✅ Server running at ${LOCAL_HOST_URL}:${PORT}`);
    });
  } catch (err: any) {
    // Catches both Supabase errors and unexpected runtime errors
    console.error('🚨 Failed to start server:', err.message || err);
    // Exit with failure code so process managers (PM2, Docker, etc.) know something went wrong
    process.exit(1);
  }
};

startServer();