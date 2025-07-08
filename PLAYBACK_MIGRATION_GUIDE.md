# 🎵 Playback State Migration Guide

## What This Migration Does

Adds a `playback_state` column to the `room` table to enable shared playback control between users.

## How to Run the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**

   - Navigate to your project
   - Go to the **SQL Editor**

2. **Run this SQL command:**

```sql
-- Add playback_state column to room table
ALTER TABLE room
ADD COLUMN IF NOT EXISTS playback_state JSONB
DEFAULT '{"is_playing": false, "current_track_uri": null, "progress_ms": 0, "controlled_by_user_id": null}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_room_playback_state
ON room USING GIN (playback_state);

-- Add comment for documentation
COMMENT ON COLUMN room.playback_state IS 'Stores current playback state: is_playing, current_track_uri, progress_ms, controlled_by_user_id';
```

3. **Click "Run"** to execute the migration

### Option 2: Using the Migration Script

If you have your environment variables set up:

1. **Create a `.env` file in the backend directory** with:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. **Run the migration:**

```bash
cd backend
node run-playback-migration.js
```

## What This Enables

After the migration, both users in a room will be able to:

- ✅ See the same play/pause button state
- ✅ Control playback together
- ✅ See who is currently controlling playback
- ✅ Sync playback state in real-time

## Testing the Migration

1. **Check the column exists:**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'room' AND column_name = 'playback_state';
```

2. **Test the default value:**

```sql
SELECT room_id, playback_state
FROM room
LIMIT 1;
```

## Troubleshooting

- **If you get "column already exists"**: The migration has already been run
- **If you get permission errors**: Make sure you're using the service role key
- **If the app still shows errors**: Restart your backend server after the migration

## Next Steps

After running the migration:

1. Restart your backend server
2. Test the shared playback controls
3. Both users should now see synchronized play/pause buttons
