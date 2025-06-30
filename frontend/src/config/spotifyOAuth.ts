// Spotify OAuth Configuration
export const SPOTIFY_OAUTH_CONFIG = {
  CLIENT_ID: 'f805d2782059483e801da7782a7e04c8',
  REDIRECT_URI: '0km-app://spotify-callback',
  SCOPES: [
    'user-read-recently-played',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
  ].join(' '),
  AUTH_URL: 'https://accounts.spotify.com/authorize',
  TOKEN_URL: 'https://accounts.spotify.com/api/token',
  API_BASE: 'https://api.spotify.com/v1',
};

// Spotify App Settings for Developer Dashboard
export const SPOTIFY_APP_SETTINGS = {
  APP_NAME: '0-KM Music Together',
  APP_DESCRIPTION: 'Music sharing for couples',
  REDIRECT_URIS: [
    '0km-app://spotify-callback',
    'exp://127.0.0.1:19000/--oauthredirect',
    'exp://localhost:19000/--oauthredirect',
  ],
};
