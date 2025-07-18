// src/api/apiClient.ts
import { Platform } from 'react-native';

const HOST = process.env.EXPO_PUBLIC_API_HOST!;
const PORT = process.env.EXPO_PUBLIC_API_PORT!;
const PUBLIC_URL = process.env.EXPO_PUBLIC_API_PUBLIC_URL!;

if (!HOST || !PORT || !PUBLIC_URL) {
  throw new Error(
    'Define EXPO_PUBLIC_API_HOST, EXPO_PUBLIC_API_PORT & EXPO_PUBLIC_API_PUBLIC_URL in .env',
  );
}

const LOCAL_URL = `${HOST}:${PORT}`;

// web → LOCAL_URL
// On a real device or stimulator → PUBLIC_URL
export const BASE_URL = Platform.OS === 'web' ? LOCAL_URL : PUBLIC_URL;

// Create a simple API client
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request(
    endpoint: string,
    options: RequestInit = {},
    userToken?: string | null,
    customHeaders?: Record<string, string>,
  ) {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(userToken && { Authorization: `Bearer ${userToken}` }),
        ...customHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        };
      }

      return response;
    } catch (error) {
      // Only log non-400 and non-404 errors to reduce noise from expected client errors
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status !== 400 &&
        error.status !== 404
      ) {
      }
      throw error;
    }
  }

  async get(endpoint: string, userToken?: string | null, customHeaders?: Record<string, string>) {
    const response = await this.request(endpoint, { method: 'GET' }, userToken, customHeaders);

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Try to parse JSON, but handle empty responses gracefully
    try {
      return await response.json();
    } catch (error) {
      // If response is empty or not JSON, return null
      return null;
    }
  }

  async post(
    endpoint: string,
    data?: any,
    userToken?: string | null,
    customHeaders?: Record<string, string>,
  ) {
    const response = await this.request(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      userToken,
      customHeaders,
    );

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Try to parse JSON, but handle empty responses gracefully
    try {
      return await response.json();
    } catch (error) {
      // If response is empty or not JSON, return null
      return null;
    }
  }

  async put(
    endpoint: string,
    data?: any,
    userToken?: string | null,
    customHeaders?: Record<string, string>,
  ) {
    const response = await this.request(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      userToken,
      customHeaders,
    );

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Try to parse JSON, but handle empty responses gracefully
    try {
      return await response.json();
    } catch (error) {
      // If response is empty or not JSON, return null
      return null;
    }
  }

  async delete(
    endpoint: string,
    userToken?: string | null,
    customHeaders?: Record<string, string>,
  ) {
    const response = await this.request(endpoint, { method: 'DELETE' }, userToken, customHeaders);

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Try to parse JSON, but handle empty responses gracefully
    try {
      return await response.json();
    } catch (error) {
      // If response is empty or not JSON, return null
      return null;
    }
  }
}

// Export the API client instance
export const apiClient = new ApiClient(BASE_URL);

// Helper function to get user token (to be used in components)
export const getUserToken = async () => {
  try {
    const { useAuth } = await import('@clerk/clerk-expo');
    // Note: This function should be called from within a React component
    // where useAuth() is valid
    return null; // For now, return null to avoid hook issues
  } catch (error) {
    console.log('No user token available:', error);
    return null;
  }
};
