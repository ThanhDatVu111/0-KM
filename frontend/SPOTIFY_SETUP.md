# Spotify "Music Together" Widget Setup Guide

This guide will help you set up the Spotify integration for the "Music Together" feature in your 0-KM app. This version works with **Spotify Free accounts**!

## Prerequisites

- A Spotify account (Free or Premium)
- A Spotify Developer account
- Supabase project with real-time enabled

## Step 1: Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the app details:
   - **App name**: `0-KM Music Together`
   - **App description**: `Music sharing for couples`
   - **Website**: Your app's website (optional)
   - **Redirect URIs**: Add `0km-app://spotify-callback`
   - **API/SDKs**: Select "Web API"
4. Click "Save"
5. Note down your **Client ID** and **Client Secret**

## Step 2: Configure Your App

1. Open `frontend/src/constants/spotify.ts`
2. Replace the placeholder values:
   ```typescript
   export const SPOTIFY_CONFIG = {
     CLIENT_ID: 'your_actual_client_id_here',
     CLIENT_SECRET: 'your_actual_client_secret_here',
     // ... rest of config
   };
   ```

## Step 3: Set Up Database

1. Run the SQL migration in your Supabase project:

   ```sql
   -- Copy and paste the contents of backend/migrations/spotify_sync_table.sql
   ```

2. Enable real-time for the `spotify_sync` table in Supabase:
   - Go to your Supabase dashboard
   - Navigate to Database > Replication
   - Enable real-time for the `spotify_sync` table

## Step 4: Configure App Scheme

1. Update your `app.json` to include the Spotify callback scheme:
   ```json
   {
     "expo": {
       "scheme": "0km-app",
       "ios": {
         "bundleIdentifier": "com.yourcompany.0km"
       },
       "android": {
         "package": "com.yourcompany.0km"
       }
     }
   }
   ```

## Step 5: Install Dependencies

The following packages should already be installed:

- `expo-auth-session`
- `expo-crypto`
- `expo-web-browser`

If not, install them:

```bash
npm install expo-auth-session expo-crypto expo-web-browser
```

## Step 6: Test the Integration

1. Start your development server:

   ```bash
   npm start
   ```

2. Open the app and navigate to the Home screen
3. Tap "Connect Spotify" in the widget
4. Complete the Spotify authentication flow
5. Start playing music on Spotify
6. The widget should display the current track and your music history

## Features (Free Account Compatible)

### For Host Users (Room Creator)

- Share current playing track with partner
- Browse and share playlists
- View recently played tracks
- View top tracks
- Real-time music sharing

### For Partner Users

- See what the host is currently listening to
- View host's recently played tracks
- View host's top tracks
- Cannot control playback (free account limitation)

## How It Works

1. **Authentication**: Uses OAuth 2.0 with PKCE for secure Spotify authentication
2. **Music Sharing**: Host shares current track info with partner
3. **Real-time Sync**: Uses Supabase real-time subscriptions to sync track information
4. **External Links**: Opens tracks/playlists in Spotify app for playback

## Free Account Limitations

Since this works with Spotify Free accounts, some features are limited:

- ❌ No direct playback control (play, pause, skip)
- ❌ No volume control
- ❌ No seeking within tracks
- ✅ View current track information
- ✅ Browse playlists
- ✅ Share music recommendations
- ✅ View listening history

## Troubleshooting

### Authentication fails

- Check that your Client ID and Client Secret are correct
- Verify the redirect URI matches exactly: `0km-app://spotify-callback`
- Ensure your Spotify app is properly configured in the developer dashboard

### Sync not working

- Check that real-time is enabled for the `spotify_sync` table in Supabase
- Verify both users are in the same room
- Check the browser console for any error messages

### No tracks showing

- Make sure you have played music on Spotify recently
- Check that you have playlists in your Spotify account
- Verify your Spotify account has listening history

## Security Notes

- Access tokens are stored in memory (not persisted)
- Refresh tokens are handled automatically
- Row Level Security (RLS) is enabled on the sync table
- Users can only access sync data for rooms they're members of

## API Endpoints Used

- `GET /me/player` - Get current playback state
- `GET /me/player/recently-played` - Get recently played tracks
- `GET /me/top/tracks` - Get user's top tracks
- `GET /me/playlists` - Get user's playlists
- `GET /playlists/{id}/tracks` - Get playlist tracks
- `GET /search` - Search for tracks
- `GET /tracks/{id}` - Get track details
- `GET /recommendations` - Get track recommendations

## Future Enhancements

- Music recommendations based on both users' preferences
- Collaborative playlists
- Music mood sharing
- Listening statistics
- Push notifications for new tracks
- Integration with other music services
