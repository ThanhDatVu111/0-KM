import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import React from 'react';
import icons from '@/constants/icons';
import useFont from '@/hooks/useFont';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect } from 'react';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();
WebBrowser.maybeCompleteAuthSession();

const Calendar = () => {
  const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
  const [accessToken, setToken] = useState<String | null>(null);
  const redirectUri = makeRedirectUri();
  console.log('redirect:', redirectUri);
  const [request, response, promptAsync] = Google.useAuthRequest({
    redirectUri: redirectUri,
    iosClientId: iosClientId,
    webClientId: webClientId,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  useEffect(() => {
    const loadToken = async () => {
      try {
        if (Platform.OS === 'web') {
          const token = sessionStorage.getItem('calendar_access_token');
          if (token) {
            setToken(token);
          }
        } else {
          const token = await SecureStore.getItemAsync('calendar_access_token');
          if (token) {
            setToken(token);
          }
        }
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };
    loadToken();
  }, []);
  useEffect(() => {
    if (response) {
      console.log('Google auth response: ', JSON.stringify(response, null, 2));
    }

    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (token) {
        setToken(token || null);
        try {
          if (Platform.OS !== 'web') {
            SecureStore.setItemAsync('calendar_access_token', token);
          } else {
            sessionStorage.setItem('calendar_access_token', token);
          }
        } catch (error) {
          console.error('Error saving token:', error);
        }
      }
    } else if (response?.type === 'error') {
      console.error('❌ Google Sign-In Error:', response.error);
    }
  }, [response]);

  const connectCalendar = async () => {
    try {
      const result = await promptAsync();
      if (result.type === 'error') {
        console.error('Error during promptAsync:', result.error);
      }
    } catch (error) {
      console.error('Error during Google OAuth flow:', error);
    }
  };

  const fontsLoaded = useFont();
  const router = useRouter();

  if (!fontsLoaded) {
    return (
      <View className="bg-primary flex-1 justify-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="tab-screen">
      {accessToken ? (
        <View>
          <Text>Already synced with calendar. Waiting for partner...</Text>
        </View>
      ) : (
        <View className="tab-screen">
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}>connect to</Text>
          <Image source={icons.googleCalendar} style={{ width: '100%', height: '10%' }} />
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}>
            to see mutual availability and
          </Text>
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}>
            schedule your next virtual date
          </Text>
          <TouchableOpacity
            onPress={connectCalendar}
            className="bg-calendarButton h-7 w-36 rounded-lg items-center mt-12 justify-center"
            style={{ borderColor: 'black', borderRadius: 10, borderWidth: 1 }}
          >
            <Text style={{ color: 'white', fontFamily: 'Poppins-SemiBold' }}>connect</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Calendar;
