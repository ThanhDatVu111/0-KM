const host = process.env.EXPO_PUBLIC_API_HOST;
const port = process.env.EXPO_PUBLIC_API_PORT;

export interface RefreshTokenRequest {
  client_id: string;
  client_secret: string;
  code: string;
  redirect_uri: string;
  code_verifier: string;
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
  user_id: string;
}

export interface UpdateRefreshToken {
  user_id: string;
  refresh_token: string;
}

export interface UpdatedRefreshToken {
  user_id: string;
  refresh_token: string;
}

export interface FetchRefreshTokenRequest {
  user_id: string;
}

export interface FetchRefreshTokenResponse {
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
    // 1) Build the URLSearchParams string so we can log it verbatim:
    const params = new URLSearchParams({
      client_id: request.client_id,
      client_secret: request.client_secret,
      code: request.code,
      redirect_uri: request.redirect_uri,
      grant_type: 'authorization_code',
      code_verifier: request.code_verifier || '',
    }).toString();

    // 2) Log each individual field plus the raw body string:
    console.log('--- createRefreshToken called with ---');
    console.log('client_id:      ', request.client_id);
    console.log('client_secret:  ', request.client_secret ? '[REDACTED]' : '(missing)');
    console.log('code:           ', request.code);
    console.log('redirect_uri:   ', request.redirect_uri);
    console.log('grant_type:     authorization_code');
    console.log('code_verifier:  ', request.code_verifier);
    console.log('raw POST body:  ', params);
    console.log('--------------------------------------');

    // 3) Perform the actual POST:
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    // 4) Parse Google’s JSON reply (whether OK or error):
    const result = await response.json();
    console.log('--- Google Token Endpoint Response ---');
    console.log('HTTP status:', response.status);
    console.log(JSON.stringify(result, null, 2));
    console.log('---------------------------------------');

    // 5) If Google returned an error status, throw a descriptive Error:
    if (!response.ok) {
      // Google’s JSON usually contains { error: 'invalid_grant', error_description: '…' }
      const gErr = result.error || 'unknown_error';
      const gDesc = result.error_description || JSON.stringify(result);
      throw new Error(`Google token error (${response.status}): ${gErr} — ${gDesc}`);
    }

    // 6) Otherwise, result is a valid { access_token, refresh_token, … }
    return result as CreatedRefreshToken;
  } catch (err: any) {
    // If this is our “throw new Error(…)” above, it already includes Google’s message.
    console.error('Error in createRefreshToken (caught):', err.message || err);
    throw err;
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
    const response = await fetch(`${BASE_URL}/calendar?user_id=${request.user_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response) {
      throw new Error('error trying to check refresh token of user');
    }
    const result = await response.json();
    return result.hasToken as Boolean;
  } catch (error) {
    console.error('error when checking refresh token: ', error);
  }
}

export async function updateRefreshToken(
  request: UpdateRefreshToken,
): Promise<UpdatedRefreshToken | undefined> {
  try {
    const response = await fetch(`${BASE_URL}/calendar/`, {
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

export async function fetchRefreshToken(
  request: FetchRefreshTokenRequest,
): Promise<FetchRefreshTokenResponse | undefined> {
  try {
    const response = await fetch(`${BASE_URL}/calendar/token?user_id=${request.user_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'Application/json' },
    });
    if (!response) {
      throw new Error('error trying to update user refresh token');
    }
    const result = await response.json();
    return result as FetchRefreshTokenResponse;
  } catch (error) {
    console.error('error when fetching refresh token: ', error);
  }
}
