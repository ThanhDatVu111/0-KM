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

const LOCAL_URL = `http://${HOST}:${PORT}`;

// web → LOCAL_URL
// On a real device or stimulator → PUBLIC_URL
export const BASE_URL = Platform.OS === 'web' ? LOCAL_URL : PUBLIC_URL;

// Create a simple API client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint: string) {
    const response = await this.request(endpoint, { method: 'GET' });
    return response.json();
  }

  async post(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async put(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async delete(endpoint: string) {
    const response = await this.request(endpoint, { method: 'DELETE' });
    return response.json();
  }
}

// Export the API client instance
export const apiClient = new ApiClient(BASE_URL);
