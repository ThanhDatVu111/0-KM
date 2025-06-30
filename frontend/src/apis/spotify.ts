import { BASE_URL } from './apiClient';

// Test if Spotify endpoints are reachable
export async function testSpotifyEndpoints(): Promise<boolean> {
  try {
    console.log('🧪 Testing Spotify endpoints...');
    const response = await fetch(`${BASE_URL}/spotify/test`);
    const data = await response.json();
    console.log('✅ Spotify test response:', data);
    return true;
  } catch (error) {
    console.error('❌ Spotify endpoints test failed:', error);
    return false;
  }
}

// Store user's Spotify token
export async function storeSpotifyToken(request: {
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}): Promise<void> {
  try {
    console.log('🔄 Storing Spotify token for user:', request.user_id);
    console.log('🔗 API URL:', `${BASE_URL}/spotify/tokens`);

    const response = await fetch(`${BASE_URL}/spotify/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', text);
      throw new Error(
        `Server returned non-JSON response: ${response.status} ${response.statusText}`,
      );
    }

    if (!response.ok) {
      const result = await response.json();
      console.error('❌ API error response:', result);
      throw new Error(result.error || 'Failed to store Spotify token');
    }

    console.log('✅ Spotify token stored successfully');
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error in storeSpotifyToken:', err.message);
      throw err;
    }
    throw new Error('An unknown error occurred in storeSpotifyToken');
  }
}

// Get partner's recent track
export async function getPartnerRecentTrack(request: { user_id: string }): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/spotify/partner-track/${request.user_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No partner track found
      }
      throw new Error(result.error || 'Failed to fetch partner track');
    }

    return result.data;
  } catch (err: any) {
    if (err.name === 'TypeError') {
      throw new Error(
        `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
      );
    }
    throw err;
  }
}
