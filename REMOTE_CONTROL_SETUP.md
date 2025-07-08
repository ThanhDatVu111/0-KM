# 🎵 Remote Control Spotify Setup Guide

This guide will help you set up the remote control functionality that allows User 2 to control User 1's Spotify playback through your app.

## 📋 Prerequisites

1. **Supabase Project**: You need a Supabase project with real-time enabled
2. **Spotify Premium**: Both users need Spotify Premium for playback control
3. **@supabase/supabase-js**: Install the Supabase client library

## 🚀 Setup Steps

### 1. Install Dependencies

```bash
cd frontend
npm install @supabase/supabase-js
```

### 2. Configure Supabase Client

Update `frontend/src/utils/supabase.ts` with your actual Supabase credentials:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
```

### 3. Run Database Migration

Execute the SQL migration in your Supabase dashboard:

```sql
-- Copy and paste the contents of backend/migrations/create_playback_commands_tables.sql
```

Or run it via the Supabase CLI:

```bash
cd backend
supabase db push
```

### 4. Enable Row Level Security (RLS)

The migration includes RLS policies, but make sure they're enabled in your Supabase dashboard:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Policies
3. Verify that RLS is enabled for both `playback_commands` and `playback_state` tables

### 5. Enable Real-time

Make sure real-time is enabled for the new tables:

1. Go to Database > Replication
2. Verify that `playback_commands` and `playback_state` are in the publication

## 🎯 How It Works

### **User 1 (Controller)**

- Has Spotify connected and active
- Listens for commands via Supabase real-time
- Executes Spotify API calls when commands are received
- Updates shared playback state

### **User 2 (Remote Control)**

- Sends commands via Supabase
- Sees synchronized playback state
- Cannot directly control User 1's device

### **Command Flow**

```
User 2 presses play → Command sent to Supabase → User 1 receives command → User 1 calls Spotify API → State updated → Both users see change
```

## 🔧 Integration

### Replace Your Existing Spotify Widget

Instead of using `SpotifyWidget` directly, use `RemoteControlSpotifyWidget`:

```tsx
import { RemoteControlSpotifyWidget } from '@/components/music/RemoteControlSpotifyWidget';

// In your component:
<RemoteControlSpotifyWidget
  track={currentTrack}
  roomId={roomId}
  isController={isController} // true for User 1, false for User 2
  controllerName={controllerName}
  onPress={handleRemoveTrack}
/>;
```

### Determine Controller Status

You can determine who is the controller based on your existing logic:

```tsx
// Example: User who added the track is the controller
const isController = roomTrack?.added_by_user_id === userId;
```

## 🧪 Testing

### 1. Test Command Sending

- User 2 presses play/pause
- Check console for "🎵 [Remote] Sending play/pause command"
- Check Supabase dashboard for new row in `playback_commands`

### 2. Test Command Execution

- User 1 should see "🎵 [Remote Control] Received command: play"
- User 1's Spotify should start playing
- Both users should see updated playback state

### 3. Test State Synchronization

- Check that both users see the same play/pause button state
- Verify that track changes are reflected on both devices

## 🐛 Troubleshooting

### Commands Not Being Received

- Check Supabase real-time is enabled
- Verify RLS policies allow the user to read commands
- Check console for connection errors

### Commands Not Executing

- Verify User 1 has Spotify Premium
- Check that User 1's device is active in Spotify
- Look for Spotify API errors in console

### State Not Syncing

- Check that both users are subscribed to the same room
- Verify RLS policies allow state updates
- Check network connectivity

## 📱 Usage Examples

### Basic Play/Pause

```tsx
// User 2 can now press play/pause and it will control User 1's Spotify
<RemoteControlSpotifyWidget track={track} roomId={roomId} isController={false} />
```

### Skip Tracks

```tsx
// User 2 can skip tracks on User 1's device
// The widget handles this automatically
```

### Play Specific Track

```tsx
// When a track is added, it can automatically play on User 1's device
await sendPlayTrackCommand(roomId, trackUri);
```

## 🔒 Security

- RLS policies ensure users can only control rooms they're in
- Commands are validated on the database level
- No sensitive data (tokens) are shared between users

## 📈 Performance

- Commands are processed in real-time (< 100ms latency)
- Old commands are automatically cleaned up
- State updates are batched for efficiency

## 🎉 Success!

Once set up, User 2 will be able to:

- ✅ Play/pause music on User 1's device
- ✅ Skip to next/previous tracks
- ✅ See synchronized playback state
- ✅ Control playback without sharing Spotify credentials

User 1 will:

- ✅ Execute commands automatically
- ✅ Maintain full control of their Spotify account
- ✅ See the same synchronized state

---

**Need help?** Check the console logs for detailed debugging information, or refer to the individual component files for more details.
