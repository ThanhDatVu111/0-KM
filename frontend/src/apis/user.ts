import {
  UserRequest,
  CreatedUser,
  OnboardRequest,
  OnboardResponse,
  FetchedUserResponse,
} from '@/types/users';

const host = process.env.EXPO_PUBLIC_API_HOST;
const port = process.env.EXPO_PUBLIC_API_PORT;

if (!host || !port) {
  throw new Error('Missing LOCAL_HOST_URL or PORT in your environment');
}
const BASE_URL = `${host}:${port}`;

// This function is responsible for making the API call to create a user
export async function createUser(request: UserRequest): Promise<CreatedUser> {
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      // API responded with an error status (4xx/5xx)
      throw new Error(result.error || 'Failed to create user');
    }

    // Backend returns { data: CreatedUser }
    return result.data as CreatedUser;
  } catch (err: any) {
    // Network or parsing error ends up here
    if (err.name === 'TypeError') {
      // E.g. "Network request failed"
      throw new Error(
        `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
      );
    }
    // Re‑throw any other errors
    throw err;
  }
}

export async function onboardUser(request: OnboardRequest): Promise<OnboardResponse> {
  try {
    const response = await fetch(`${BASE_URL}/users/${request.user_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      // API responded with an error status (4xx/5xx)
      throw new Error(result.error || 'Failed to onboard user');
    }

    // Backend returns { data: OnboardResponse }
    return result.data as OnboardResponse;
  } catch (err: any) {
    // Handle network or parsing errors
    if (err.name === 'TypeError') {
      throw new Error(
        `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
      );
    }
    throw err;
  }
}

export async function fetchUser(userId: string): Promise<FetchedUserResponse> {
  try {
    console.log('📱 Fetching user data for ID:', userId);

    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    console.log('📱 User fetch response:', {
      status: response.status,
      ok: response.ok,
      result,
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('📱 User not found:', userId);
        throw new Error('User not found');
      }
      throw new Error(result.error || 'Failed to fetch user data');
    }

    if (!result.data) {
      console.log('📱 No user data in response');
      throw new Error('No user data received');
    }

    return result.data as FetchedUserResponse;
  } catch (err: any) {
    console.error('📱 Error fetching user:', {
      error: err,
      userId,
      message: err.message,
    });
    throw err;
  }
}
