import { useState, useEffect } from 'react';
import { spotifyService } from '@/services/spotifyService';

export function useSpotifyAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    setIsAuthenticated(spotifyService.isAuthenticated());
  }, []);

  const authenticate = async () => {
    setIsLoading(true);
    try {
      const success = await spotifyService.authenticate();
      setIsAuthenticated(success);
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
