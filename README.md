# 0-KM 💕 (Love Knows No Distance)

🚀 A mobile app helping couples stay connected across any distance.  
Built with **Expo**, **React Native**, **Node.js**, and **Supabase**.

## Features

### 🎵 Spotify Mirror Action Playback

The app implements a sophisticated mirror action approach for synchronized Spotify playback between partners:

- **Host-Side Execution**: Only one device (the controller) actually controls Spotify playback
- **Command-Based Control**: All playback actions are sent as commands through the backend
- **Real-Time Synchronization**: Partners see synchronized playback state via real-time subscriptions
- **Rate Limiting & Error Handling**: Built-in protection against API rate limits and network issues
- **Timestamp-Aware Seeking**: Accounts for network lag when seeking to specific positions

#### How It Works:

1. **Command Sending**: When a user presses play/pause/next/etc., a command is sent to the backend
2. **Real-Time Distribution**: The command is stored in the database and distributed via Supabase real-time
3. **Host Execution**: The designated controller device receives the command and executes it on Spotify
4. **State Synchronization**: All devices update their UI based on the shared playback state

#### Database Schema:

```sql
-- playback_commands table for mirror action
CREATE TABLE playback_commands (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES room(room_id),
  command TEXT CHECK (command IN ('play', 'pause', 'next', 'previous', 'seek', 'volume')),
  track_uri TEXT,
  position_ms INTEGER,
  volume INTEGER,
  requested_at TIMESTAMP,
  requested_by_user_id UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Setup

### Installation

```bash
# Install dependencies
npm install

# Or install separately:
cd frontend && npm install
cd backend && npm install
```

### Environment Variables

```bash
# Copy environment files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Configure your environment variables
```

### Database Setup

```bash
# Run the playback commands table migration
psql -d your_database -f create-playback-commands-table.sql
```

### Running the App

```bash
# Start backend
npm run dev

# Start frontend (in another terminal)
npx expo start --clear
```

## Architecture

### Mirror Action Flow:

1. **User Action** → Frontend sends command to backend
2. **Backend Storage** → Command stored in `playback_commands` table
3. **Real-Time Distribution** → Supabase real-time broadcasts to all room members
4. **Host Execution** → Controller device executes command on Spotify API
5. **State Update** → All devices update UI based on shared state

### Key Components:

- `usePlaybackCommandListener`: Host-side command execution
- `sendPlaybackCommand`: Command sending service
- `playback_commands` table: Command storage and distribution
- Real-time subscriptions: State synchronization
