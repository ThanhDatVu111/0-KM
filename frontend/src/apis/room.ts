import {
  RoomRequest,
  CreatedRoom,
  PairRequest,
  DeleteRoomRequest,
  FetchRoomRequest,
  FetchRoomResponse,
} from '@/types/rooms';
import { BASE_URL } from './apiClient';

console.log('BASE_URL in api room:', BASE_URL);

export async function createRoom(request: RoomRequest): Promise<CreatedRoom> {
  try {
    const response = await fetch(`${BASE_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create room');
    }

    return result.data as CreatedRoom;
  } catch (err: any) {
    if (err.name === 'TypeError') {
      throw new Error(
        `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
      );
    }
    if (err instanceof Error) {
      throw new Error(`Error in createRoom: ${err.message}`);
    }
    throw new Error('An unknown error occurred in createRoom');
  }
}

export async function pairRoom(request: PairRequest): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/rooms/${request.room_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    // Check if the response is not OK (e.g., 4xx or 5xx status codes)
    if (!response.ok) {
      const result = await response.json(); // Parse the error response
      throw new Error(result.error || 'Failed to pair room');
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error in pairRoom:', err.message);
      throw err; // Re-throw the error for the caller to handle
    }
    throw new Error('An unknown error occurred in pairRoom');
  }
}

export async function deleteRoom(request: DeleteRoomRequest): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/rooms/${request.room_id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete room');
    }
  } catch (err: any) {
    throw err;
  }
}

export async function fetchRoom(request: FetchRoomRequest): Promise<FetchRoomResponse> {
  try {
    const response = await fetch(`${BASE_URL}/rooms/${request.user_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    console.log('📱 Room fetch response:', {
      status: response.status,
      ok: response.ok,
      result,
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('📱 No room found for user:', request.user_id);
      }
      throw new Error(result.error || 'Failed to fetch room data');
    }

    if (!result.data) {
      console.log('📱 No room data in response for user:', request.user_id);
    }

    return result.data as FetchRoomResponse;
  } catch (err: any) {
    console.error('📱 Error fetching room:', {
      error: err,
      user_id: request.user_id,
      message: err.message,
    });

    if (err.name === 'TypeError') {
      throw new Error(
        `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
      );
    }
    throw err;
  }
}
