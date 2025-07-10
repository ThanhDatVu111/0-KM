import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { updateUserLocation } from '@/apis/user';

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timezone: string;
}

class LocationTrackingService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private userId: string | null = null;
  private lastUpdateTime = 0;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly DISTANCE_THRESHOLD = 1000; // 1km in meters
  private lastLocation: LocationData | null = null;

  async startTracking(userId: string) {
    if (this.isTracking) {
      console.log('📍 Location tracking already active');
      return;
    }

    this.userId = userId;
    console.log('📍 Starting location tracking for user:', userId);

    try {
      // Request permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (foregroundStatus !== 'granted' || backgroundStatus !== 'granted') {
        console.error('📍 Location permissions not granted');
        throw new Error('Location permissions required for real-time updates');
      }

      // Configure location settings
      await Location.setGoogleApiKey(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '');

      // Start location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 100, // 100 meters
          showsBackgroundLocationIndicator: true,
        },
        this.handleLocationUpdate.bind(this),
      );

      this.isTracking = true;
      console.log('✅ Location tracking started successfully');
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      throw error;
    }
  }

  async stopTracking() {
    if (this.locationSubscription) {
      await this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    this.userId = null;
    console.log('📍 Location tracking stopped');
  }

  private async handleLocationUpdate(location: Location.LocationObject) {
    const now = Date.now();

    // Check if enough time has passed since last update
    if (now - this.lastUpdateTime < this.UPDATE_INTERVAL) {
      return;
    }

    // Check if location has changed significantly
    if (this.lastLocation) {
      const distance = this.calculateDistance(
        this.lastLocation.latitude,
        this.lastLocation.longitude,
        location.coords.latitude,
        location.coords.longitude,
      );

      if (distance < this.DISTANCE_THRESHOLD) {
        return; // Location hasn't changed significantly
      }
    }

    try {
      console.log('📍 Location update detected:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      // Get city and country from coordinates
      const geocodeResult = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocodeResult.length > 0) {
        const address = geocodeResult[0];
        const locationData: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city: address.city || 'Unknown City',
          country: address.country || 'Unknown Country',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        // Update the last location
        this.lastLocation = locationData;
        this.lastUpdateTime = now;

        // Send to backend
        if (this.userId) {
          await this.updateBackendLocation(locationData);
        }
      }
    } catch (error) {
      console.error('❌ Error processing location update:', error);
    }
  }

  private async updateBackendLocation(locationData: LocationData) {
    try {
      if (!this.userId) return;

      console.log('📍 Updating backend with new location:', locationData);

      await updateUserLocation({
        user_id: this.userId,
        location_latitude: locationData.latitude,
        location_longitude: locationData.longitude,
        location_city: locationData.city,
        location_country: locationData.country,
        timezone: locationData.timezone,
      });

      console.log('✅ Location updated in backend successfully');
    } catch (error) {
      console.error('❌ Failed to update location in backend:', error);
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  isTrackingActive(): boolean {
    return this.isTracking;
  }

  getLastLocation(): LocationData | null {
    return this.lastLocation;
  }
}

// Export singleton instance
export const locationTrackingService = new LocationTrackingService();
