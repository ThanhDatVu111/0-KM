import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { fetchWeatherByLocation, fetchWeatherByCity, WeatherData } from '@/apis/weather';
import { usePartnerData } from '@/hooks/usePartnerData';

type WeatherWidgetProps = {
  className?: string;
  fallbackUserName?: string;
  defaultCity?: string;
  isLocationEnabled?: boolean;
};

function RetroHeader({ title }: { title: string }) {
  return (
    <View className="bg-[#6536DD] border-b-2 border-black px-4 py-3 items-center rounded-t-md">
      <View className="relative">
        {[
          [-2, 0],
          [2, 0],
          [0, -2],
          [0, 2],
        ].map(([dx, dy], index) => (
          <Text
            key={index}
            style={{
              position: 'absolute',
              fontFamily: 'PressStart2P',
              fontSize: 12,
              color: 'white',
              left: dx,
              top: dy,
            }}
          >
            {title}
          </Text>
        ))}

        <Text
          style={{
            fontFamily: 'PressStart2P',
            fontSize: 12,
            color: '#F24187',
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

export function WeatherWidget({
  className = '',
  fallbackUserName = 'Partner',
  defaultCity = 'San Francisco',
  isLocationEnabled = true,
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
      console.log('🌤️ Partner location latitude:', partnerData?.location?.latitude);
      console.log('🌤️ Partner location longitude:', partnerData?.location?.longitude);
      console.log('🌤️ Partner location city:', partnerData?.location?.city);
      console.log('🌤️ Partner location country:', partnerData?.location?.country);

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
        console.log('🌤️ Partner location data is missing - using fallback');
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
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="WEATHER" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <View className="items-center">
            <Ionicons name="refresh" size={24} color="#6536DD" />
            <Text
              style={{
                fontFamily: 'PixelifySans',
                fontSize: 14,
              }}
              className="text-black mt-2"
            >
              Loading weather...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Show message if location is disabled
  if (!isLocationEnabled) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="WEATHER" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <View className="items-center">
            <Ionicons name="location-outline" size={24} color="#6536DD" />
            <Text
              style={{
                fontFamily: 'PixelifySans',
                fontSize: 14,
              }}
              className="text-center text-black mt-2"
            >
              Enable location to see your partner's weather
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!hasRoom || !partnerData) {
    return (
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="WEATHER" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 14,
            }}
            className="text-center text-black"
          >
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
      <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
        <RetroHeader title="WEATHER" />
        <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
          <View className="items-center">
            {isApiKeyMissing ? (
              <>
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 14,
                  }}
                  className="text-black mb-2"
                >
                  Demo Mode
                </Text>
                <Ionicons name="sunny" size={32} color="#6536DD" />
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 24,
                  }}
                  className="text-black mt-2"
                >
                  72°F
                </Text>
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 12,
                  }}
                  className="text-gray-600 mt-1"
                >
                  Sunny
                </Text>
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 12,
                  }}
                  className="text-gray-500 mt-1"
                >
                  {partnerCity}, {partnerCountry}
                </Text>
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 12,
                  }}
                  className="text-gray-400 mt-2 text-center px-2"
                >
                  Add EXPO_PUBLIC_WEATHER_API_KEY to .env for real data
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-offline" size={24} color="#6536DD" />
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 14,
                  }}
                  className="text-black mt-2 text-center"
                >
                  {error || 'Weather unavailable'}
                </Text>
                <TouchableOpacity
                  onPress={handleRefresh}
                  className="bg-[#6536DD] border-2 border-black mt-2"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 4,
                  }}
                >
                  <View className="bg-[#6536DD] px-3 py-1">
                    <Text
                      style={{
                        fontFamily: 'PixelifySans',
                        fontSize: 12,
                      }}
                      className="text-white"
                    >
                      Retry
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={`w-full h-full shadow-2xl border-2 border-black rounded-lg ${className}`}>
      <RetroHeader title="WEATHER" />
      <View className="bg-white px-4 py-4 rounded-b-md flex-1 justify-center">
        {/* Header with refresh button */}
        <View className="flex-row justify-between items-center mb-2">
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 12,
            }}
            className="text-black"
          >
            {userName}'s weather
          </Text>
          <TouchableOpacity onPress={handleRefresh} className="p-1">
            <Ionicons name="refresh" size={12} color="#6536DD" />
          </TouchableOpacity>
        </View>

        <View className="items-center">
          {/* Weather Icon */}
          <Ionicons name={getWeatherIcon(weatherData.icon) as any} size={32} color="#6536DD" />

          {/* Temperature */}
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 24,
            }}
            className="text-black mt-2"
          >
            {weatherData.temperature}°F
          </Text>

          {/* Description */}
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 12,
            }}
            className="text-gray-600 mt-1 text-center capitalize"
          >
            {weatherData.description}
          </Text>

          {/* Location */}
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 12,
            }}
            className="text-gray-500 mt-1 text-center"
          >
            {weatherData.city}, {weatherData.country}
          </Text>

          {/* Additional info */}
          <View className="flex-row items-center mt-2">
            <Ionicons name="thermometer" size={10} color="#6536DD" />
            <Text
              style={{
                fontFamily: 'PixelifySans',
                fontSize: 12,
              }}
              className="text-gray-600 ml-1"
            >
              Feels like {weatherData.feelsLike}°F
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
