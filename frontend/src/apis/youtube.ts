import { BASE_URL } from './apiClient';

// Test if YouTube endpoints are reachable
export async function testYouTubeEndpoints(): Promise<boolean> {
  try {
    console.log('🧪 Testing YouTube endpoints...');
    const response = await fetch(`${BASE_URL}/youtube/test`);
    const data = await response.json();
    console.log('✅ YouTube test response:', data);
    return true;
  } catch (error) {
    console.error('❌ YouTube endpoints test failed:', error);
    return false;
  }
}

// Create or update user's YouTube video
export async function upsertYouTubeVideo(request: {
  user_id: string;
  video_id: string;
  title?: string;
}): Promise<any> {
  try {
    console.log('🔄 Upserting YouTube video for user:', request.user_id);
    console.log('🔗 API URL:', `${BASE_URL}/youtube/videos`);

    const response = await fetch(`${BASE_URL}/youtube/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    console.log('📡 Response status:', response.status);

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
      throw new Error(result.error || 'Failed to save YouTube video');
    }

    const result = await response.json();
    console.log('✅ YouTube video saved successfully');
    return result.data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error in upsertYouTubeVideo:', err.message);
      throw err;
    }
    throw new Error('An unknown error occurred in upsertYouTubeVideo');
  }
}

// Get user's YouTube video
export async function getUserYouTubeVideo(request: { user_id: string }): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/youtube/videos/${request.user_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No YouTube video found
      }
      throw new Error(result.error || 'Failed to fetch YouTube video');
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

// Get partner's YouTube video
export async function getPartnerYouTubeVideo(request: { user_id: string }): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/youtube/partner-video/${request.user_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No partner YouTube video found
      }
      throw new Error(result.error || 'Failed to fetch partner YouTube video');
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

// Delete user's YouTube video
export async function deleteUserYouTubeVideo(request: { user_id: string }): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/youtube/videos/${request.user_id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete YouTube video');
    }

    return true;
  } catch (err: any) {
    if (err.name === 'TypeError') {
      throw new Error(
        `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
      );
    }
    throw err;
  }
}
