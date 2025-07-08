# 🐛 Debug: User 2 Not Hearing Music (Auto-Play Issue)

## 🚨 **Problem:**

- **User 1** plays music → User 1 hears music ✅
- **User 2** doesn't hear anything → Auto-play not working ❌

## 🔍 **Debug Steps:**

### **1. Check Console Logs for Auto-Play**

Look for these logs when User 1 plays music:

**✅ Good Logs (Auto-play working):**

```
🎵 Auto-play check: {
  "userId": "user2",
  "isController": false,
  "isPlaying": true,
  "currentTrackUri": "spotify:track:123456",
  "lastAutoPlayedTrack": null,
  "shouldAutoPlay": true
}
🎵 Auto-playing track on non-controller device: spotify:track:123456
```

**❌ Bad Logs (Auto-play not working):**

```
🎵 Auto-play check: {
  "userId": "user2",
  "isController": true,  // Should be false
  "isPlaying": false,    // Should be true
  "currentTrackUri": null,  // Should have track URI
  "shouldAutoPlay": false   // Should be true
}
```

### **2. Check User 2's Spotify Connection**

**User 2 needs Spotify connected for auto-play to work:**

**✅ User 2 with Spotify:**

```
🎵 Auto-playing track on non-controller device: spotify:track:123456
// Music should start playing on User 2's device
```

**❌ User 2 without Spotify:**

```
🎵 Auto-play skipped - User not connected to Spotify (this is normal)
// User 2 won't hear music (expected behavior)
```

### **3. Check Controller Assignment**

**User 2 should NOT be the controller:**

**✅ Correct:**

```
🎵 Updating shared state: {
  "userId": "user2",
  "isController": false,  // User 2 is NOT controller
  "currentController": "user1"  // User 1 is controller
}
```

**❌ Wrong:**

```
🎵 Updating shared state: {
  "userId": "user2",
  "isController": true,  // User 2 is controller (wrong!)
  "currentController": "user2"  // User 2 is controller (wrong!)
}
```

## 🧪 **Test Steps:**

### **Setup:**

1. **User 1**: Connect Spotify, add a track
2. **User 2**: Connect Spotify (optional - for testing)

### **Test 1: User 1 Plays Music**

1. **User 1**: Click play
2. **Check User 2's console** for auto-play logs
3. **Expected**: User 2 should see auto-play logs and hear music

### **Test 2: User 2 Controls**

1. **User 2**: Click play/pause
2. **Check logs**: Should see "Requesting playback change"
3. **Expected**: User 1's Spotify should respond

## 🔧 **Common Issues & Fixes:**

### **Issue 1: User 2 is Controller**

**Symptoms:** User 2 becomes controller but has no Spotify
**Fix:** The controller logic fix should prevent this

### **Issue 2: No Track URI**

**Symptoms:** `currentTrackUri: null`
**Fix:** User 1 needs to add a track first

### **Issue 3: User 2 Not Connected to Spotify**

**Symptoms:** "Auto-play skipped - User not connected to Spotify"
**Fix:** User 2 needs to connect their Spotify account

### **Issue 4: Auto-Play Not Triggering**

**Symptoms:** No auto-play logs at all
**Fix:** Check if User 2 is in the same room and polling is working

## 🎯 **Expected Flow:**

```
User 1 clicks play:
├── Updates shared state: is_playing = true, current_track_uri = "spotify:track:123"
├── User 1's Spotify starts playing
├── User 1 hears music
├── User 2's app polls shared state (every 2 seconds)
├── User 2 detects: is_playing = true, current_track_uri = "spotify:track:123"
├── User 2 auto-plays same track
└── User 2 hears music
```

## 🚀 **Key Points:**

1. **User 2 must be connected to Spotify** to hear music
2. **User 2 must NOT be the controller** (should be User 1)
3. **Shared state must have a track URI** (User 1 must add a track)
4. **Polling must work** (User 2 checks every 2 seconds)
5. **Auto-play only triggers once per track** (prevents loops)

## 🔍 **Debug Checklist:**

- [ ] User 1 is controller (`isController: false` for User 2)
- [ ] Shared state has `is_playing: true`
- [ ] Shared state has `current_track_uri: "spotify:track:..."`
- [ ] User 2 is connected to Spotify
- [ ] Auto-play logs appear in User 2's console
- [ ] No "Auto-play skipped" messages (unless User 2 has no Spotify)

The enhanced logging should help identify exactly where the auto-play is failing!
