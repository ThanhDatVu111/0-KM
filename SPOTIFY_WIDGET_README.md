# Spotify Widget Implementation for 0-KM

This document describes the implementation of a Spotify widget that allows two users in a room to share and control Spotify music together.

## Features

### 🎵 Music Sharing

- **Room-based music sharing**: Users in the same room can share Spotify tracks
- **Real-time synchronization**: Both users see the same track information
- **Track metadata**: Displays track name, artist, album, album art, and duration

### 🎛️ Music Controls

- **Play/Pause**: Control playback state
- **Skip tracks**: Navigate to next/previous tracks
- **Volume control**: Adjust playback volume
- **Progress tracking**: Visual progress bar with time display

### 🔍 Music Discovery

- **Spotify search**: Search for tracks, artists, and albums
- **Track selection**: Browse and select tracks to share
- **Quick add**: One-tap track sharing with partner

## Architecture

### Frontend Components

#### `SpotifyWidget.tsx`

- Main widget component for displaying current track
- Shows album art, track info, progress bar, and controls
- Handles empty state when no track is playing
- Supports track removal for the user who added it

#### `SpotifyInput.tsx`

- Modal component for searching and selecting Spotify tracks
- Real-time search functionality
- Track preview with album art and metadata
- Add track functionality

#### `useRoomSpotifyTrack.ts`

- Custom hook for managing Spotify track state
- Handles room-based track fetching and updates
- Automatic refetching for real-time updates

### Backend Services

#### Database Schema

```sql
-- Room-based Spotify tracks (shared experience)
CREATE TABLE room_spotify_tracks (
    id UUID PRIMARY KEY,
    room_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    track_name TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    album_name TEXT NOT NULL,
    album_art_url TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    track_uri TEXT NOT NULL,
    added_by_user_id TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### API Endpoints

- `POST /spotify/room` - Create room Spotify track
- `GET /spotify/room/:user_id` - Get current room track
- `PUT /spotify/room/:user_id` - Update room track
- `DELETE /spotify/room/:user_id` - Delete room track
- `GET /spotify/search?q=query` - Search Spotify tracks
- `POST /spotify/play` - Play track
- `POST /spotify/pause` - Pause playback
- `POST /spotify/next` - Skip to next track
- `POST /spotify/previous` - Skip to previous track
- `POST /spotify/volume` - Set volume

## Setup Instructions

### 1. Database Migration

Run the Spotify database migration:

```bash
cd backend
node run-spotify-migration.js
```

This creates the necessary tables and applies Row Level Security (RLS) policies.

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Spotify API (for future integration)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=your_redirect_uri
```

### 3. Dependencies

The implementation uses existing dependencies:

- `@expo/vector-icons` - For music icons
- `expo-linear-gradient` - For gradient backgrounds
- `@clerk/clerk-expo` - For user authentication

## Usage

### Adding Music to Room

1. **Join a room** with your partner
2. **Tap "+ Add"** in the Spotify widget section
3. **Search for music** using the search bar
4. **Select a track** from the search results
5. **Confirm selection** to add to room

### Controlling Music

- **Play/Pause**: Tap the play/pause button
- **Skip tracks**: Use the skip forward/backward buttons
- **Remove track**: Tap the X button (only for user who added it)

### Real-time Updates

- Track changes are automatically synchronized between users
- Both users see the same track information and controls
- Changes are reflected in real-time (15-second polling interval)

## Spotify API Integration

### Current Implementation

The current implementation uses mock data for demonstration purposes. The search functionality returns predefined tracks that match the search query.

### Future Integration

To integrate with the actual Spotify Web API:

1. **OAuth Flow**: Implement Spotify OAuth for user authentication
2. **Access Tokens**: Store and manage Spotify access tokens
3. **Web API Calls**: Replace mock data with actual Spotify API calls
4. **Playback Control**: Use Spotify Web Playback SDK for real playback control

### Required Spotify API Scopes

```javascript
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'playlist-read-collaborative',
];
```

## Security

### Row Level Security (RLS)

The database implements RLS policies to ensure:

- Users can only access tracks in rooms they belong to
- Users can only modify tracks they added
- Secure token storage for Spotify API access

### API Security

- All endpoints require user authentication
- Room membership validation for all operations
- Input validation and sanitization

## Styling

### Design System

The Spotify widget follows the app's design system:

- **Colors**: Spotify green (#1DB954) gradient
- **Typography**: Poppins font family
- **Layout**: Consistent with other widgets
- **Animations**: Smooth transitions and feedback

### Responsive Design

- Adapts to different screen sizes
- Maintains aspect ratios for album art
- Responsive text sizing and spacing

## Testing

### Manual Testing Checklist

- [ ] Join room with partner
- [ ] Add Spotify track to room
- [ ] Verify track appears for both users
- [ ] Test music controls (play/pause, skip)
- [ ] Remove track and verify cleanup
- [ ] Test search functionality
- [ ] Verify real-time updates

### Error Handling

- Network connectivity issues
- Invalid track data
- Room membership validation
- Spotify API rate limits

## Future Enhancements

### Planned Features

1. **Spotify Connect**: Real Spotify playback control
2. **Playlist Support**: Share entire playlists
3. **Queue Management**: Collaborative queue building
4. **Audio Visualization**: Real-time audio visualizations
5. **Offline Support**: Cached track information

### Technical Improvements

1. **WebSocket Integration**: Real-time updates instead of polling
2. **Caching**: Local cache for better performance
3. **Background Playback**: Continue playing when app is minimized
4. **Cross-platform**: iOS and Android native playback

## Troubleshooting

### Common Issues

**Track not appearing for partner**

- Check room membership
- Verify network connectivity
- Check console for API errors

**Search not working**

- Verify backend is running
- Check search query format
- Review API response logs

**Controls not responding**

- Check user permissions
- Verify track ownership
- Review Spotify API status

### Debug Logging

The implementation includes comprehensive debug logging:

- Track state changes
- API request/response
- User interactions
- Error conditions

## Contributing

When contributing to the Spotify widget:

1. **Follow existing patterns** for consistency
2. **Add comprehensive tests** for new features
3. **Update documentation** for API changes
4. **Consider security implications** of new features
5. **Test with real Spotify accounts** when possible

## License

This implementation is part of the 0-KM project and follows the same licensing terms.
