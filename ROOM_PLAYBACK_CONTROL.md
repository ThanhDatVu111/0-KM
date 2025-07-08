# 🎵 Room-Based Spotify Playback Control

## How It Works

### The Problem

- **User 1** connects Spotify → can control their own Spotify
- **User 2** connects Spotify → can control their own Spotify
- **But User 2 can't control User 1's music** (Spotify API limitation)

### The Solution: Room-Based Control

We implemented a **shared playback state** system where:

1. **Only one user controls the actual Spotify playback** (the "controller")
2. **All users can request changes** through the shared state
3. **The controller responds to shared state changes** and executes them on their Spotify

## 🔄 Flow Example

### Scenario: User 1 is the controller, User 2 wants to pause

1. **User 2 clicks pause button**

   - Updates shared state: `is_playing: false`
   - Logs: "🎵 Requesting playback change - waiting for controller to respond"

2. **User 1's app polls shared state** (every 2 seconds)

   - Detects change: `is_playing: false`
   - Executes: `spotifyPlayback.togglePlayPause()`
   - Logs: "🎵 Controller executed local Spotify control"

3. **User 1's Spotify pauses**
   - Both users see the pause button
   - Both users hear the music stop

## 🎯 Visual Indicators

The widget now shows:

- **"You control"** - This user is the controller
- **"Partner controls"** - The other user is the controller

## 🛠️ Technical Details

### Shared State Structure

```typescript
{
  is_playing: boolean,
  current_track_uri: string,
  progress_ms: number,
  controlled_by_user_id: string  // Who controls the actual Spotify
}
```

### Key Functions

- `togglePlayPause()` - Only controller executes local Spotify control
- `playTrack()` - Only controller executes local Spotify control
- `skipToNext()` - Only controller executes local Spotify control
- `skipToPrevious()` - Only controller executes local Spotify control

### Polling

- Shared state is polled every 2 seconds
- Controller automatically syncs local Spotify state to shared state
- All users see real-time updates

## 🧪 Testing

1. **User 1**: Connect Spotify, add a track
2. **User 2**: Connect Spotify, see "Partner controls" indicator
3. **User 2**: Click play/pause - should see "Requesting playback change" in logs
4. **User 1**: Should see "Controller executed local Spotify control" in logs
5. **Both users**: Should see the button change and hear music play/pause

## 🔧 Debugging

Check the console logs for:

- `🎵 Toggle Play/Pause:` - Shows who's making the request
- `🎵 Requesting playback change` - Non-controller user
- `🎵 Controller executed local Spotify control` - Controller user

## 🚀 Benefits

- ✅ **Real-time sync** between users
- ✅ **Clear visual feedback** on who controls what
- ✅ **Works with Spotify API limitations**
- ✅ **Graceful fallbacks** if controller disconnects
- ✅ **Automatic state recovery** when controller reconnects
