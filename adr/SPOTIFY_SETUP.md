# Spotify OAuth Setup Guide

This guide will help you set up Spotify OAuth for the 0-KM app. The app now uses the same OAuth pattern as Google OAuth for consistency.

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
   - **Redirect URI**: `exp://fb4hvyo-anonymous-8081.exp.direct` (for development)
4. Click "Save"
5. Note down your **Client ID** and **Client Secret**

## Step 2: Get Your Redirect URI

The app uses `AuthSession.makeRedirectUri()` which automatically generates the correct redirect URI for your environment:

- **Development**: `exp://fb4hvyo-anonymous-8081.exp.direct` (or similar)
- **Production**: `0km-app://` (your app scheme)

To get your exact redirect URI:

1. Run the helper script:

   ```bash
   cd frontend
   node get-redirect-uri.js
   ```

2. Copy the displayed URI and add it to your Spotify App settings

## Step 3: Configure Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Spotify OAuth Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=exp://fb4hvyo-anonymous-8081.exp.direct

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=3001
LOCAL_URL=http://localhost:3001
PUBLIC_URL=https://your-domain.com
```

## Step 4: Configure Frontend Environment Variables

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
   - The app will use the same OAuth pattern as Google
   - Use the DEBUG button to check the connection status

## Troubleshooting

### OAuth Issues

**Error: "Failed to get authorization code"**

- Check that the redirect URI in Spotify Developer Dashboard matches the one from `get-redirect-uri.js`
- Ensure the Spotify app is properly configured
- Make sure you're using the development redirect URI for testing

**Web browser doesn't open**

- Check that `expo-web-browser` is properly installed
- Ensure the app has proper permissions
- Try restarting the Expo development server

**Connection shows as connected but doesn't work**

- Use the DEBUG button to check the connection status
- Look for Spotify tokens in SecureStore
- Check the console logs for detailed error messages

## How It Works

### OAuth Flow (Same as Google)

1. Frontend uses `AuthSession.makeRedirectUri()` to get the correct redirect URI
2. Frontend creates Spotify OAuth URL with the redirect URI
3. Frontend opens URL in browser using `WebBrowser.openAuthSessionAsync()`
4. User authorizes the app
5. Spotify redirects back to the app with an authorization code
6. Frontend exchanges the code for access tokens
7. Tokens are stored securely in Expo SecureStore

### Key Differences from Previous Version

- Uses `AuthSession.makeRedirectUri()` instead of hardcoded scheme
- Handles OAuth entirely in the frontend (like Google OAuth)
- Stores tokens in SecureStore instead of Supabase
- Uses the same WebBrowser pattern as Google OAuth

## Production Deployment

When deploying to production:

1. Update the redirect URI in Spotify Developer Dashboard to: `0km-app://`
2. Update the backend environment variable: `SPOTIFY_REDIRECT_URI=0km-app://`
3. The app will automatically use the correct redirect URI based on the environment
