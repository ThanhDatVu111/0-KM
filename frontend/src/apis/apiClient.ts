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
//export const BASE_URL = LOCAL_URL;