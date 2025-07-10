// Weather API service using OpenWeatherMap
// You'll need to get a free API key from https://openweathermap.org/api

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export type WeatherData = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  city: string;
  country: string;
};

export const fetchWeatherByLocation = async (
  latitude: number,
  longitude: number,
): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${WEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=imperial`,
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
      country: data.sys.country,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

export const fetchWeatherByCity = async (city: string): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${WEATHER_BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=imperial`,
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
      country: data.sys.country,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};
