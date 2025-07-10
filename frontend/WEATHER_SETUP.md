# Weather Widget Setup Guide

The weather widget uses the OpenWeatherMap API to fetch real-time weather data. Follow these steps to set it up:

## 1. Get an OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to "API keys" section
4. Generate a new API key (it's free for up to 1000 calls/day)

## 2. Configure Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Supabase Configuration (if not already set)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Weather API Configuration
EXPO_PUBLIC_WEATHER_API_KEY=your_openweathermap_api_key_here
```

## 3. Features

The weather widget includes:

- Real-time temperature display
- Weather description and icon
- Location-based weather (uses device GPS)
- Fallback to default city if location is unavailable
- Refresh functionality
- Error handling with retry option

## 4. Usage

The weather widget will automatically:

1. Request location permissions
2. Fetch weather data for the user's current location
3. Display temperature, weather description, and location
4. Show loading and error states appropriately

## 5. Customization

You can customize the widget by passing props:

- `userName`: The name to display (default: "Alex")
- `defaultCity`: Fallback city if location is unavailable (default: "San Francisco")
- `className`: Additional CSS classes for styling

Example:

```tsx
<WeatherWidget userName="John" defaultCity="New York" className="custom-styles" />
```
