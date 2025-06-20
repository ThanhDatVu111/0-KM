// Spotify API Configuration
export const SPOTIFY_CONFIG = {
  // You'll need to replace these with your actual Spotify app credentials
  CLIENT_ID: 'f805d2782059483e801da7782a7e04c8',
  CLIENT_SECRET: '06b28132afaf4c0b9c1f3224c268c35b',

  // Scopes for free accounts (read-only access)
  SCOPES: [
    'user-read-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-recently-played',
    'user-top-read',
  ],

  // API endpoints
  AUTH_URL: 'https://accounts.spotify.com/authorize',
  TOKEN_URL: 'https://accounts.spotify.com/api/token',
  API_BASE: 'https://api.spotify.com/v1',

  // Sync settings
  SYNC_INTERVAL: 10000, // 10 seconds
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

// Spotify branding colors
export const SPOTIFY_COLORS = {
  PRIMARY: '#1DB954',
  SECONDARY: '#191414',
  WHITE: '#FFFFFF',
  GRAY: '#666666',
  LIGHT_GRAY: '#F0F0F0',
};

// Error messages
export const SPOTIFY_ERRORS = {
  AUTHENTICATION_FAILED: 'Failed to authenticate with Spotify',
  NO_ACTIVE_DEVICE: 'No active Spotify device found',
  SYNC_FAILED: 'Failed to sync with other users',
  NETWORK_ERROR: 'Network error occurred',
  FREE_ACCOUNT_LIMITATION: 'This feature requires Spotify Premium',
};
