// src/services/spotifyService.ts

import * as spotifyModel from '../models/spotifyModel';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

/**
 * Store or update a user's Spotify tokens & expiry in your DB
 */
export async function storeSpotifyToken(input: {
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // in ms since epoch
}) {
  return spotifyModel.upsertSpotifyToken(input);
}

/**
 * Fetch the partner's recently played track, auto‐refreshing if needed
 */
export async function getPartnerRecentTrack(user_id: string) {
  try {
    // 1) Find the partner
    const partnerId = await spotifyModel.getPartnerId(user_id);
    if (!partnerId) return null;

    // 2) Load their token data
    const tokenData = await spotifyModel.getSpotifyToken(partnerId);
    console.log('🔍 tokenData:', {
      access_token: tokenData?.access_token?.slice(0, 8) + '…',
      refresh_token: tokenData?.refresh_token?.slice(0, 8) + '…',
      expires_at: tokenData?.expires_at,
      now: Date.now(),
    });
    if (!tokenData || !tokenData.access_token) return null;

    // 3) If expired, refresh first
    if (tokenData.expires_at && Date.now() > tokenData.expires_at) {
      console.log('⏱ Token expired, refreshing…');
      if (tokenData.refresh_token) {
        await refreshSpotifyToken(partnerId, tokenData.refresh_token);
        // reload fresh data
        const reloaded = await spotifyModel.getSpotifyToken(partnerId);
        return fetchSpotifyRecentTrack(reloaded!.access_token, reloaded!.refresh_token, partnerId);
      }
      return null;
    }

    // 4) Otherwise fetch directly (with auto‐refresh on 401/403)
    return fetchSpotifyRecentTrack(tokenData.access_token, tokenData.refresh_token, partnerId);
  } catch (err) {
    console.error('❌ getPartnerRecentTrack error:', err);
    return null;
  }
}

/**
 * Call Spotify's "recently played" endpoint.
 * On a 401/403, attempt one refresh and retry.
 */
async function fetchSpotifyRecentTrack(
  accessToken: string,
  refreshToken: string | undefined,
  user_id: string,
) {
  const doFetch = (token: string) =>
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

  // 1) First attempt
  let response = await doFetch(accessToken);

  // 2) If invalid, refresh & retry
  if ([401, 403].includes(response.status) && refreshToken) {
    console.log('🔄 Access token invalid (', response.status, '), refreshing…');
    try {
      const newToken = await refreshSpotifyToken(user_id, refreshToken);
      console.log('🎫 Got new token:', newToken.slice(0, 8), '…');
      response = await doFetch(newToken);
    } catch (e) {
      console.error('❌ refreshSpotifyToken failed:', e);
      return null;
    }
  }

  // 3) Final error handling
  if (!response.ok) {
    console.error('❌ Spotify API error after retry:', response.status, response.statusText);
    return null;
  }

  // 4) Parse & return the most recent track
  const data = await response.json();
  return data.items?.[0]?.track || null;
}

/**
 * Refresh a user's Spotify token and store the new expiry
 */
export async function refreshSpotifyToken(user_id: string, refresh_token: string) {
  if (!SPOTIFY_CLIENT_SECRET) {
    throw new Error('SPOTIFY_CLIENT_SECRET not configured');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
    client_id: SPOTIFY_CLIENT_ID,
    client_secret: SPOTIFY_CLIENT_SECRET,
  }).toString();

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('❌ /api/token refresh failed:', errText);
    throw new Error('Failed to refresh Spotify token');
  }

  const data = await res.json();
  const newExpiry = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;

  // Persist new token + expiry
  await spotifyModel.updateSpotifyToken({
    user_id,
    access_token: data.access_token,
    expires_at: newExpiry,
  });

  return data.access_token;
}
