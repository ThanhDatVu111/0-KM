# Spotify OAuth Setup Guide

This guide will help you set up Spotify OAuth for the 0-KM app. The app supports two OAuth flows: backend-based OAuth (recommended) and Supabase OAuth (fallback).

## Prerequisites

1. A Spotify Developer account
2. A Supabase project
3. Access to environment variables for both frontend and backend

## Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the app details:
   - **App name**: `0-KM` (or your preferred name)
   - **App description**: `A mobile app for couples to share music`
   - **Website**: `https://your-domain.com` (optional)
   - **Redirect URI**: `0km-app://` (for mobile app)
4. Click "Save"
5. Note down your **Client ID** and **Client Secret**

## Step 2: Configure Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Spotify OAuth Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=0km-app://

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=3001
LOCAL_URL=http://localhost:3001
PUBLIC_URL=https://your-domain.com
```

## Step 3: Configure Frontend Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
EXPO_PUBLIC_API_HOST=localhost
EXPO_PUBLIC_API_PORT=3001
EXPO_PUBLIC_API_PUBLIC_URL=http://localhost:3001

# Other APIs (optional)
EXPO_PUBLIC_WEATHER_API_KEY=your_weather_api_key_here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Step 4: Configure Supabase OAuth (Optional - Fallback)

If you want to use Supabase OAuth as a fallback:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Spotify** and click **Enable**
4. Enter your Spotify Client ID and Client Secret
5. Set the Redirect URL to: `0km-app://`
6. Save the configuration

## Step 5: Test the Setup

1. Start the backend server:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Start the frontend:

   ```bash
   cd frontend
   npm install
   npx expo start
   ```

3. In the app, try to connect Spotify:
   - The app will first try backend OAuth
   - If that fails, it will fall back to Supabase OAuth
   - Use the DEBUG button to check the connection status

## Troubleshooting

### Backend OAuth Issues

**Error: "Backend OAuth not configured"**

- Check that `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REDIRECT_URI` are set in backend `.env`
- Restart the backend server after adding environment variables

**Error: "Failed to get authorization code"**

- Check that the redirect URI in Spotify Developer Dashboard matches `0km-app://`
- Ensure the Spotify app is properly configured

### Supabase OAuth Issues

**Error: "No OAuth URL received from Supabase"**

- Check that Spotify provider is enabled in Supabase
- Verify the Client ID and Client Secret in Supabase settings
- Ensure the redirect URL is set correctly

### General Issues

**Web browser doesn't open**

- Check that `expo-web-browser` is properly installed
- Ensure the app has proper permissions
- Try restarting the Expo development server

**Connection shows as connected but doesn't work**

- Use the DEBUG button to check the connection status
- Look for Spotify tokens in user metadata
- Check the console logs for detailed error messages

## How It Works

### Backend OAuth Flow (Primary)

1. Frontend requests auth URL from backend
2. Backend generates Spotify OAuth URL
3. Frontend opens URL in browser
4. User authorizes the app
5. Spotify redirects back with authorization code
6. Frontend sends code to backend
7. Backend exchanges code for access/refresh tokens
8. Tokens are stored in Supabase user metadata

### Supabase OAuth Flow (Fallback)

1. Frontend requests OAuth URL from Supabase
2. Supabase generates Spotify OAuth URL
3. Frontend opens URL in browser
4. User authorizes the app
5. Supabase handles the OAuth callback automatically
6. Spotify provider is added to user's app_metadata

## Security Notes

- Access tokens expire after 1 hour
- Refresh tokens should be used to get new access tokens
- Store tokens securely (consider using encrypted storage)
- Never expose client secrets in client-side code
- Use HTTPS in production

## API Scopes

The app requests the following Spotify scopes:

- `user-read-private`: Read user's private information
- `user-read-email`: Read user's email address
- `user-read-playback-state`: Read user's playback state
- `user-modify-playback-state`: Control user's playback
- `user-read-currently-playing`: Read currently playing track
- `streaming`: Control playback on user's devices
- `playlist-read-private`: Read user's private playlists
- `playlist-read-collaborative`: Read collaborative playlists
