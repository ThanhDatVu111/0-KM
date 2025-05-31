const host = process.env.EXPO_PUBLIC_API_HOST;
const port = process.env.EXPO_PUBLIC_API_PORT;

export interface RefreshTokenRequest {
  client_id: string;
  client_secret: string;
  code: string;
  redirect_uri: string;
}

export interface CreatedRefreshToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface AccessTokenRequest {
  client_id: string;
  client_secret: string;
  grant_type: 'refresh_token';
  refresh_token: string;
}

export interface CreatedAccessToken {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: 'Bearer';
}

export interface CheckRefreshToken {
  room_id: string;
}

export interface UpdateRefreshToken {
  room_id: string;
  refresh_token: string;
}

export interface UpdatedRefreshToken {
  room_id: string;
  refresh_token: string;
}

if (!host || !port) {
  throw new Error('Missing LOCAL_HOST_URL or PORT in your environment');
}
const BASE_URL = `${host}:${port}`;

export async function createRefreshToken(
  request: RefreshTokenRequest,
): Promise<CreatedRefreshToken> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: request.client_id,
        client_secret: request.client_secret,
        code: request.code,
        grant_type: 'authorization_code',
        redirect_uri: request.redirect_uri,
      }).toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create room');
    }

    return result as CreatedRefreshToken;
  } catch (err: any) {
    if (err.name === 'TypeError') {
      throw new Error(
        `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
      );
    }
    if (err instanceof Error) {
      throw new Error(`Error in createRefreshToken: ${err.message}`);
    }
    throw new Error('An unknown error occurred in creating refresh token');
  }
}

export async function fetchNewAccessToken(
  request: AccessTokenRequest,
): Promise<CreatedAccessToken> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: request.client_id,
        client_secret: request.client_secret,
        grant_type: request.grant_type,
        refresh_token: request.refresh_token,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'failed to create access token');
    }
    return result as CreatedAccessToken;
  } catch (err: any) {
    if (err.name === 'TypeError') {
      throw new Error(
        `Unable to connect to server at ${BASE_URL}. Please check your network or that the backend is running.`,
      );
    }
    if (err instanceof Error) {
      throw new Error(`Error in createRefreshToken: ${err.message}`);
    }
    throw new Error('An unknown error occurred in creating refresh token');
  }
}

export async function checkRefreshToken(request: CheckRefreshToken): Promise<Boolean | undefined> {
  try {
    const response = await fetch('/calendar/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response) {
      throw new Error('error trying to check refresh token of user');
    }
    const result = await response.json();
    return result as Boolean;
  } catch (error) {
    console.error('error when checking refresh token: ', error);
  }
}

export async function updateRefreshToken(
  request: UpdateRefreshToken,
): Promise<UpdatedRefreshToken | undefined> {
  try {
    const response = await fetch('/calendar/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response) {
      throw new Error('error trying to update user refresh token');
    }
    const result = await response.json();
    return result as UpdatedRefreshToken;
  } catch (error) {
    console.error('error when updating refresh token: ', error);
  }
}
