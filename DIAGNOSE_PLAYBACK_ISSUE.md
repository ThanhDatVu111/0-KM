# 🔍 Diagnose Playback Issue: Backend vs Frontend

## 🚨 **Problem:**

User 2 doesn't hear music when User 1 plays, even though auto-play should work.

## 🔍 **Step-by-Step Diagnosis:**

### **1. Check Backend Server Status**

**Start the backend server:**

```bash
cd backend
npm start
```

**Expected output:**

```
Server running on port 3001
Database connected successfully
```

**If backend fails to start:**

- Check if port 3001 is available
- Check if database connection is working
- Check if all dependencies are installed

### **2. Check Database Migration**

**Verify the playback_state column exists:**

```sql
-- Connect to your Supabase database and run:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'room' AND column_name = 'playback_state';
```

**Expected result:**

```
column_name     | data_type
playback_state  | jsonb
```

**If column doesn't exist:**

```bash
cd backend
node run-spotify-migration.js
```

### **3. Test Backend API Endpoints**

**Test GET playback state:**

```bash
curl -X GET http://localhost:3001/api/rooms/YOUR_ROOM_ID/playback
```

**Expected response:**

```json
{
  "data": {
    "is_playing": false,
    "current_track_uri": null,
    "progress_ms": 0,
    "controlled_by_user_id": null
  }
}
```

**Test PUT playback state:**

```bash
curl -X PUT http://localhost:3001/api/rooms/YOUR_ROOM_ID/playback \
  -H "Content-Type: application/json" \
  -d '{
    "playback_state": {
      "is_playing": true,
      "current_track_uri": "spotify:track:123456",
      "progress_ms": 0
    },
    "user_id": "user_123"
  }'
```

**Expected response:**

```json
{
  "data": {
    "playback_state": {
      "is_playing": true,
      "current_track_uri": "spotify:track:123456",
      "progress_ms": 0,
      "controlled_by_user_id": "user_123"
    }
  }
}
```

### **4. Check Frontend Environment Variables**

**Verify .env file in frontend:**

```env
EXPO_PUBLIC_API_HOST=localhost
EXPO_PUBLIC_API_PORT=3001
EXPO_PUBLIC_API_PUBLIC_URL=http://YOUR_IP:3001
```

**Check if variables are loaded:**

```javascript
console.log('API Config:', {
  HOST: process.env.EXPO_PUBLIC_API_HOST,
  PORT: process.env.EXPO_PUBLIC_API_PORT,
  PUBLIC_URL: process.env.EXPO_PUBLIC_API_PUBLIC_URL,
  BASE_URL: BASE_URL,
});
```

### **5. Test Frontend API Connection**

**Add this debug code to your frontend:**

```javascript
// In your component, add this test:
useEffect(() => {
  const testAPI = async () => {
    try {
      const response = await apiClient.get('/rooms/test/playback');
      console.log('✅ API connection test:', response.status);
    } catch (error) {
      console.log('❌ API connection failed:', error);
    }
  };
  testAPI();
}, []);
```

### **6. Check Console Logs**

**Look for these specific logs:**

**✅ Good Backend Logs:**

```
🎵 Getting playback state for room: room_123
🎵 Playback state result: { is_playing: true, ... }
```

**✅ Good Frontend Logs:**

```
🎵 Auto-play check: { isController: false, isPlaying: true, shouldAutoPlay: true }
🎵 Auto-playing track on non-controller device: spotify:track:123456
```

**❌ Bad Logs:**

```
Error updating playback state, using local state: [Error: ...]
Error getting playback state, using default: [Error: ...]
🎵 Auto-play skipped - User not connected to Spotify
```

### **7. Check Network Requests**

**Open browser dev tools (if on web) or React Native debugger:**

- Go to Network tab
- Look for requests to `/rooms/*/playback`
- Check if requests are successful (200 status)
- Check if responses contain the expected data

### **8. Test Complete Flow**

**Step-by-step test:**

1. **User 1**: Connect Spotify, add track
2. **User 1**: Click play
3. **Check User 1's console**: Should see controller logs
4. **Check User 2's console**: Should see auto-play logs
5. **Check Network**: Should see PUT/GET requests to playback endpoint

## 🔧 **Common Issues & Fixes:**

### **Issue 1: Backend Not Running**

**Symptoms:** All API calls fail
**Fix:** Start backend server with `npm start`

### **Issue 2: Database Migration Not Run**

**Symptoms:** 500 errors on playback endpoints
**Fix:** Run migration script

### **Issue 3: Environment Variables Wrong**

**Symptoms:** API calls go to wrong URL
**Fix:** Check .env file and restart frontend

### **Issue 4: Network Issues**

**Symptoms:** Timeout errors
**Fix:** Check firewall, use correct IP address

### **Issue 5: CORS Issues**

**Symptoms:** CORS errors in browser
**Fix:** Add CORS middleware to backend

## 🎯 **Quick Test Commands:**

```bash
# Test backend
curl http://localhost:3001/api/rooms/test/playback

# Test frontend API client
# Add console.log in your component to test connection

# Check database
# Run SQL query to verify playback_state column
```

## 🚀 **Expected Behavior:**

1. **Backend**: Responds to playback API calls
2. **Database**: Has playback_state column with JSONB data
3. **Frontend**: Can connect to backend API
4. **Auto-play**: User 2 gets auto-play logs and hears music
5. **Network**: Successful PUT/GET requests to playback endpoints

Run through this checklist to identify exactly where the issue is occurring!
