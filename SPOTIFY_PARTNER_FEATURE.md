# Spotify Partner Listening Feature

This feature allows couples to see what their partner is currently listening to on Spotify in real-time.

## Overview

The "What We're Listening To" feature consists of two widgets:

1. **Your Music Widget** - Shows your current Spotify track
2. **Partner's Music Widget** - Shows your partner's current Spotify track

## Setup Instructions

### 1. Database Setup

Run the migration to create the `spotify_tokens` table:

```sql
-- Run the migration file: backend/migrations/create_spotify_tokens_table.sql
```

### 2. Environment Variables

Add these to your backend `.env` file:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 3. Spotify App Configuration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use existing one
3. Add these redirect URIs:
   - `0km-app://spotify-callback`
   - `exp://127.0.0.1:19000/--oauthredirect`
   - `exp://localhost:19000/--oauthredirect`

### 4. Required Scopes

The app requests these Spotify scopes:

- `user-read-playback-state`
- `user-read-currently-playing`

## How It Works

### Frontend Flow

1. **Authentication**: When a user connects Spotify, their access token is stored in the backend
2. **Room Detection**: The app checks if the user is in a room with a partner
3. **Partner Track Fetching**: Every 15 seconds, the app fetches the partner's current track from the backend
4. **Display**: Both widgets show current tracks with album art, track info, and play/pause status

### Backend Flow

1. **Token Storage**: User's Spotify tokens are stored in the `spotify_tokens` table
2. **Partner Lookup**: When fetching partner's track, the backend:
   - Finds the user's room
   - Identifies the partner's user ID
   - Retrieves the partner's Spotify token
   - Calls Spotify API to get current track
3. **API Response**: Returns the partner's current track data

## API Endpoints

### Store Spotify Token

```
POST /spotify/tokens
Body: {
  "user_id": "string",
  "access_token": "string",
  "refresh_token": "string" (optional),
  "expires_at": "number" (optional)
}
```

### Get Partner's Current Track

```
GET /spotify/partner-track/:user_id
Response: Spotify playback state or null
```

## Components

### Frontend Components

- `NowPlayingWidget` - Shows user's current track
- `PartnerListeningWidget` - Shows partner's current track
- `useCurrentTrack` - Hook for user's track
- `usePartnerTrack` - Hook for partner's track
- `useSpotifyAuth` - Hook for Spotify authentication

### Backend Components

- `spotifyModel` - Database operations for Spotify tokens
- `spotifyService` - Business logic for Spotify operations
- `spotifyController` - HTTP request handling
- `spotifyRoutes` - API route definitions

## Features

### Real-time Updates

- Both widgets poll every 15 seconds for updates
- Shows play/pause status
- Displays album art, track name, artist, and album

### Deep Linking

- Tap any track to open it in the Spotify app
- Works for both user's and partner's tracks

### Room-based Display

- Partner widget only shows when user is in a room
- Shows appropriate messages when no room or no partner track

### Error Handling

- Graceful handling of expired tokens
- Network error recovery
- Missing partner data handling

## Security

- Row Level Security (RLS) on the `spotify_tokens` table
- Users can only access their own tokens
- Secure token storage in database
- No tokens exposed in frontend logs

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh when expired
2. **Push Notifications**: Notify when partner starts playing music
3. **Listening History**: Show recent tracks played by partner
4. **Shared Playlists**: Create and share playlists between partners
5. **Listening Together**: Synchronized playback between partners

## Troubleshooting

### Common Issues

1. **Partner track not showing**: Check if partner has connected Spotify
2. **Token expired**: Implement token refresh mechanism
3. **No room found**: Ensure user is paired with a partner
4. **API errors**: Check Spotify API rate limits and credentials

### Debug Steps

1. Check browser console for frontend errors
2. Check backend logs for API errors
3. Verify Spotify app configuration
4. Test database connectivity
5. Check environment variables
