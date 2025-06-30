import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { spotifyService } from '@/services/spotifyService';
import { storeSpotifyToken, testSpotifyEndpoints } from '@/apis/spotify';

export function useSpotifyAuth() {
  const { userId } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    setIsAuthenticated(spotifyService.isAuthenticated());
  }, []);

  const authenticate = async () => {
    if (!userId) {
      console.error('No user ID available for Spotify authentication');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await spotifyService.authenticate();
      if (success) {
        setIsAuthenticated(true);

        // Test if backend endpoints are working
        const endpointsWorking = await testSpotifyEndpoints();
        if (!endpointsWorking) {
          console.error('❌ Spotify backend endpoints are not reachable');
          return success; // Don't fail auth, just skip backend storage
        }

        // Store the token in the backend
        const accessToken = spotifyService.getAccessToken();
        const refreshToken = spotifyService.getRefreshToken();
        const expiresAt = spotifyService.getExpiresAt();

        if (accessToken) {
          try {
            await storeSpotifyToken({
              user_id: userId,
              access_token: accessToken,
              refresh_token: refreshToken || undefined,
              expires_at: expiresAt || undefined,
            });
            console.log('Spotify token stored in backend');
          } catch (error) {
            console.error('Failed to store Spotify token in backend:', error);
            // Don't fail the authentication if backend storage fails
          }
        }
      }
      return success;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    spotifyService.logout();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    authenticate,
    logout,
    accessToken: spotifyService.getAccessToken(),
  };
}
