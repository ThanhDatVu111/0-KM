import {
  UserRequest,
  CreatedUser,
  OnboardRequest,
  OnboardResponse,
  FetchedUserResponse,
} from '@/types/users';
import { BASE_URL } from './apiClient';

console.log('BASE_URL:', BASE_URL);

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
      // E.g. “Network request failed”
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
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch user data');
    }

    return result.data as FetchedUserResponse;
  } catch (err: any) {
    if (err.name === 'TypeError') {
      throw new Error(
        `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
      );
    }
    throw err;
  }
}

export async function updateUserProfileUnified(
  userId: string,
  data: {
    username?: string;
    birthdate?: string;
    photo_url?: string;
  },
) {
  // Only include fields that are present in the data object
  const updatePayload: Record<string, any> = {};
  if (data.username) updatePayload.username = data.username; // string
  if (data.birthdate) updatePayload.birthdate = data.birthdate; // string
  if (data.photo_url) updatePayload.photo_url = data.photo_url; // string (local uri)

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update user profile');
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
