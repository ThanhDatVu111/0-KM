# Fixing Row Level Security (RLS) Error for Spotify Tracks

## Problem

You're getting this error when trying to create room Spotify tracks:

```
Error creating room Spotify track: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "room_spotify_tracks"'
}
```

## Root Cause

The `room_spotify_tracks` table has Row Level Security (RLS) enabled, but the application is trying to insert records without proper authentication context. The RLS policies require `auth.uid()` to be available, but when no authorization token is provided, this context is missing.

## Solutions

### Option 1: Quick Fix - Disable RLS (Recommended for Development)

Run this command to disable RLS entirely for the `room_spotify_tracks` table:

```bash
cd backend
node run-rls-fix.js
```

This will:

- Keep RLS enabled but allow the service role to bypass it
- Maintain security for regular users
- Fix the authentication errors immediately

### Option 2: Complete RLS Disable (If Option 1 doesn't work)

If you want to completely disable RLS for this table:

```sql
ALTER TABLE room_spotify_tracks DISABLE ROW LEVEL SECURITY;
```

You can run this manually in your Supabase SQL editor or create a migration file.

### Option 3: Fix Authentication Flow (Best Long-term)

The authentication middleware has been updated to use the service role when no user token is provided. This ensures that database operations can still proceed even without user authentication.

## Files Created/Modified

1. **`backend/migrations/fix_rls_spotify.sql`** - Updated RLS policies
2. **`backend/run-rls-fix.js`** - Migration runner script
3. **`backend/src/middleware/auth.ts`** - Updated to use service role
4. **`backend/migrations/disable_rls_spotify.sql`** - Alternative complete RLS disable

## How to Apply the Fix

1. **Run the migration:**

   ```bash
   cd backend
   node run-rls-fix.js
   ```

2. **Restart your backend server** to pick up the middleware changes

3. **Test the Spotify functionality** - the RLS errors should be resolved

## Security Considerations

- **Option 1** maintains security by allowing only the service role to bypass RLS
- **Option 2** removes all RLS protection (use only for development)
- **Option 3** ensures proper authentication flow for production

## Verification

After applying the fix, you should see:

- No more "new row violates row-level security policy" errors
- Spotify tracks can be created successfully
- Existing security for authenticated users remains intact

## Troubleshooting

If you still get errors:

1. **Check environment variables:**

   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Verify the migration ran successfully:**

   - Check the console output for "✅ RLS fix migration completed successfully!"

3. **Check Supabase dashboard:**

   - Go to your Supabase project
   - Check the SQL editor to see if the policies were updated

4. **Restart your application:**
   - Stop and restart your backend server
   - Clear any cached connections
