import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import supabase from './db';
import UserRouter from './routes/userRoutes';
// import other routers like TripRouter, NotificationRouter if needed

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const LOCAL_HOST_URL = process.env.LOCAL_HOST_URL;

app.use(express.json()); // Parse incoming JSON requests
app.use(cors()); //allows the backend to respond to requests from the frontend.

//If the frontend makes a request to /user/..., go look in UserRouter to handle it.
app.use('/user', UserRouter);

// ✅ Start server
const startServer = async () => {
  // If you want to test connection, you can add a Supabase health check here (optional)
  console.log('Checking Supabase connectivity...');
  // Test query to check connection
  const { error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return;
  }
  app.listen(PORT, () => {
    console.log(`✅ Server running at ${LOCAL_HOST_URL}${PORT}`);
  });
};

startServer();
