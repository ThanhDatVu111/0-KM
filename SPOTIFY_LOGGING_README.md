# Spotify Logging Improvements

## Overview

The Spotify-related logging has been improved to reduce console spam while maintaining useful debugging information.

## Changes Made

### Backend Changes

- **Created logger utility**: `backend/src/utils/logger.ts`
- **Updated Spotify service**: Reduced verbose logging in `backend/src/services/spotifyService.ts`
- **Updated Spotify controller**: Reduced verbose logging in `backend/src/controllers/spotifyController.ts`

### Frontend Changes

- **Created logger utility**: `frontend/src/utils/logger.ts`
- **Updated hooks**: Reduced spammy logging in:
  - `frontend/src/hooks/useRoomSpotifyTrack.ts`
  - `frontend/src/hooks/useSharedPlayback.ts`
  - `frontend/src/hooks/usePlaybackCommandListener.ts`

## Log Levels

The logger supports different log levels that can be controlled via environment variables:

### Backend Log Levels

Set `LOG_LEVEL` environment variable:

- `ERROR` (0): Only error messages
- `WARN` (1): Warnings and errors
- `INFO` (2): Info, warnings, and errors (default)
- `DEBUG` (3): All messages including debug

### Frontend Log Levels

- **Development**: Defaults to `INFO` level
- **Production**: Defaults to `ERROR` level only
- Can be controlled via `__DEV__` flag

## Usage

### Backend

```typescript
import { logger } from '../utils/logger';

// Different log levels
logger.error('Critical error occurred');
logger.warn('Warning message');
logger.info('Important information');
logger.debug('Debug information');

// Spotify-specific logging
logger.spotify.error('Spotify error');
logger.spotify.warn('Spotify warning');
logger.spotify.info('Spotify info');
logger.spotify.debug('Spotify debug');
```

### Frontend

```typescript
import { logger } from '@/utils/logger';

// Same API as backend
logger.spotify.info('Spotify info message');
logger.spotify.debug('Spotify debug message');
```

## Benefits

1. **Reduced Console Spam**: Debug messages are now controlled and less frequent
2. **Better Error Visibility**: Important errors are still prominently displayed
3. **Configurable**: Log levels can be adjusted for different environments
4. **Consistent**: All Spotify-related logging uses the same format and levels
5. **Performance**: Reduced logging overhead in production

## Environment Setup

To control backend logging, add to your `.env` file:

```
LOG_LEVEL=INFO  # or ERROR, WARN, DEBUG
```

## Migration Notes

- All existing `console.log` statements for Spotify functionality have been replaced with appropriate logger calls
- Debug messages are now throttled and controlled
- Error messages are still immediately visible
- Real-time subscription logs are reduced but still available for debugging
