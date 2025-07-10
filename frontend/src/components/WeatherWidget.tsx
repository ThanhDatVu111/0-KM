import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { fetchWeatherByLocation, fetchWeatherByCity, WeatherData } from '@/apis/weather';
import { usePartnerData } from '@/hooks/usePartnerData';

type WeatherWidgetProps = {
  className?: string;
  fallbackUserName?: string;
  defaultCity?: string;
};

export function WeatherWidget({
  className = '',
  fallbackUserName = 'Partner',
  defaultCity = 'San Francisco',
}: WeatherWidgetProps) {
  const { partnerData, hasRoom, isLoading: partnerLoading } = usePartnerData();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeatherIcon = (iconCode: string) => {
    // Map OpenWeatherMap icon codes to Ionicons
    const iconMap: { [key: string]: string } = {
      '01d': 'sunny',
      '01n': 'moon',
      '02d': 'partly-sunny',
      '02n': 'cloudy-night',
      '03d': 'cloud',
      '03n': 'cloud',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'water',
      '50n': 'water',
    };
    return iconMap[iconCode] || 'partly-sunny';
  };

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if API key is available
      if (!process.env.EXPO_PUBLIC_WEATHER_API_KEY) {
        setError(
          'Weather API key not configured. Please add EXPO_PUBLIC_WEATHER_API_KEY to your .env file.',
        );
        setWeatherData(null);
        return;
      }

      console.log('🌤️ Fetching weather data...');
      console.log('🌤️ Partner data:', partnerData);
      console.log('🌤️ Partner location:', partnerData?.location);

      let data: WeatherData;

      // Use partner's location if available, otherwise use partner's city, then default city
      if (partnerData?.location?.latitude && partnerData?.location?.longitude) {
        console.log(
          '🌤️ Using partner coordinates:',
          partnerData.location.latitude,
          partnerData.location.longitude,
        );
        // Use exact coordinates for most accurate weather
        data = await fetchWeatherByLocation(
          partnerData.location.latitude,
          partnerData.location.longitude,
        );
      } else if (partnerData?.location?.city) {
        console.log('🌤️ Using partner city:', partnerData.location.city);
        // Use partner's city name if coordinates not available
        data = await fetchWeatherByCity(partnerData.location.city);
      } else {
        console.log('🌤️ Using default city:', defaultCity);
        // Fallback to default city
        data = await fetchWeatherByCity(defaultCity);
      }

      console.log('🌤️ Weather data received:', data);
      setWeatherData(data);
    } catch (err) {
      console.error('❌ Error fetching weather:', err);
      setError(
        `Failed to fetch weather data: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRoom && partnerData) {
      fetchWeather();
    }
  }, [hasRoom, partnerData]);

  const handleRefresh = () => {
    fetchWeather();
  };

  const userName = partnerData?.username || fallbackUserName;
  const isLoading = partnerLoading || loading;

  if (isLoading) {
    return (
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 ${className}`}
        style={{ borderWidth: 1.5, borderRadius: 16 }}
      >
        <LinearGradient
          colors={['#6536DA', '#F7BFF7']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            zIndex: -1,
          }}
        />
        <Text className="mb-2 font-pregular text-sm text-white">{fallbackUserName}'s weather</Text>
        <View className="flex-1 items-center justify-center">
          <Ionicons name="refresh" size={32} color="white" />
          <Text className="font-pregular text-sm text-white mt-2">Loading weather...</Text>
        </View>
      </View>
    );
  }

  if (!hasRoom || !partnerData) {
    return (
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 ${className}`}
        style={{ borderWidth: 1.5, borderRadius: 16 }}
      >
        <LinearGradient
          colors={['#6536DA', '#F7BFF7']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            zIndex: -1,
          }}
        />
        <Text className="mb-2 font-pregular text-sm text-white">{fallbackUserName}'s weather</Text>
        <View className="flex-1 items-center justify-center">
          <Text className="font-pregular text-sm text-white text-center">
            {!hasRoom ? 'No partner connected' : 'Partner location unavailable'}
          </Text>
        </View>
      </View>
    );
  }

  if (error || !weatherData) {
    const isApiKeyMissing = error?.includes('API key not configured');

    // Get partner's city for display
    const partnerCity = partnerData?.location?.city || 'Unknown City';
    const partnerCountry = partnerData?.location?.country || 'Unknown Country';

    return (
      <View
        className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 ${className}`}
        style={{ borderWidth: 1.5, borderRadius: 16 }}
      >
        <LinearGradient
          colors={['#6536DA', '#F7BFF7']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            zIndex: -1,
          }}
        />
        <Text className="mb-2 font-pregular text-sm text-white">{userName}'s weather</Text>
        <View className="flex-1 items-center justify-center">
          {isApiKeyMissing ? (
            <>
              <Text className="font-pregular text-sm text-white mb-2">Demo Mode</Text>
              <Ionicons name="sunny" size={48} color="white" />
              <Text className="font-pbold text-5xl text-white mt-2">72°F</Text>
              <Text className="font-pregular text-sm text-white/80 mt-1">Sunny</Text>
              <Text className="font-pregular text-xs text-white/60 mt-1">
                {partnerCity}, {partnerCountry}
              </Text>
              <Text className="font-pregular text-xs text-white/40 mt-2 text-center px-2">
                Add EXPO_PUBLIC_WEATHER_API_KEY to .env for real data
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-offline" size={32} color="white" />
              <Text className="font-pregular text-sm text-white mt-2 text-center">
                {error || 'Weather unavailable'}
              </Text>
              <TouchableOpacity
                onPress={handleRefresh}
                className="bg-white/20 rounded-full px-3 py-1 mt-2"
              >
                <Text className="text-white font-pregular text-xs">Retry</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      className={`border border-black bg-white/10 shadow-md backdrop-blur-lg p-4 ${className}`}
      style={{ borderWidth: 1.5, borderRadius: 16 }}
    >
      <LinearGradient
        colors={['#6536DA', '#F7BFF7']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 16,
          zIndex: -1,
        }}
      />

      {/* Header with refresh button */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-pregular text-sm text-white">{userName}'s weather</Text>
        <TouchableOpacity onPress={handleRefresh} className="p-1">
          <Ionicons name="refresh" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center">
        {/* Weather Icon */}
        <Ionicons name={getWeatherIcon(weatherData.icon) as any} size={48} color="white" />

        {/* Temperature */}
        <Text className="font-pbold text-5xl text-white mt-2">{weatherData.temperature}°F</Text>

        {/* Description */}
        <Text className="font-pregular text-sm text-white/80 mt-1 text-center capitalize">
          {weatherData.description}
        </Text>

        {/* Location */}
        <Text className="font-pregular text-xs text-white/60 mt-1 text-center">
          {weatherData.city}, {weatherData.country}
        </Text>

        {/* Partner's actual location if different from weather API response */}
        {partnerData?.location?.city && partnerData.location.city !== weatherData.city && (
          <Text className="font-pregular text-xs text-white/40 mt-1 text-center">
            Partner in: {partnerData.location.city}, {partnerData.location.country}
          </Text>
        )}

        {/* Additional info */}
        <View className="flex-row items-center mt-2">
          <Ionicons name="thermometer" size={12} color="white" />
          <Text className="font-pregular text-xs text-white/80 ml-1">
            Feels like {weatherData.feelsLike}°F
          </Text>
        </View>
      </View>
    </View>
  );
}
