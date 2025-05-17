export interface roomRequest {
  room_id: string;
  user_1: string;
}

export interface createdRoom {
  room_id: string;
  user_1: string;
  user_2: string;
  created_at: string;
}

export interface pairRequest {
  room_id: string;
  user_2: string;
}

export interface deleteRoomRequest {
  room_id: string;
}

const host = process.env.EXPO_PUBLIC_API_HOST;
const port = process.env.EXPO_PUBLIC_API_PORT;

if (!host || !port) {
  throw new Error('Missing LOCAL_HOST_URL or PORT in your environment');
}
const BASE_URL = `${host}:${port}`;

export async function createRoom(request: roomRequest): Promise<createdRoom> {
  try {
    const response = await fetch(`${BASE_URL}/room/createRoom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      // API responded with an error status (4xx/5xx)
      throw new Error(result.error || 'Failed to create room');
    }

    // Backend returns { data: CreatedUser }
    return result.data as createdRoom;
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

export async function pairRoom(request: pairRequest): Promise<createdRoom> {
  try {
    const response = await fetch(`${BASE_URL}/room/joinRoom`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to join room');
    }

    return result.data as createdRoom;
  } catch (err: any) {
    throw err;
  }
}

export async function deleteRoom(request: deleteRoomRequest): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/room/deleteRoom/${request.room_id}`, {
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
