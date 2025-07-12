import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '0-KM',
  slug: '0-km',
  version: '1.0.0',
  scheme: '0km-app',

  orientation: 'portrait',
  icon: './src/assets/images/logo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './src/assets/images/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.chtran.x0km',
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './src/assets/images/logo.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.chtran.x0km',
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    weatherApiKey: process.env.EXPO_PUBLIC_WEATHER_API_KEY,
  },
});
