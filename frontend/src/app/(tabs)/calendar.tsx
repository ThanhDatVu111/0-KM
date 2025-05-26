import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import React from 'react';
import icons from '@/constants/icons';
import useFont from '@/hooks/useFont';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

const Calendar = () => {
  const [accessToken, setToken] = useState<String | null>(null);
  const [request, response, promptAsync] = Google.useAuthRequest({
    redirectUri: 'https://auth.expo.io/@aanh1009/0km-app',
    iosClientId: '152482242112-2c1othbu00qpt0725oki6u782hoppagj.apps.googleusercontent.com',
    webClientId: '152482242112-vgd2s47q3btrf7ksrhksa99heju44qd6.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/calendar'],
    clientSecret: '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',
  });

  useEffect(() => {
    const loadToken = async () => {
      if (Platform.OS == 'web') {
        const token = localStorage.getItem('calendar_access_token');
        if (token) {
          setToken(token);
        }
      } else {
        const token = await SecureStore.getItemAsync('calendar_access_token');
        if (token) {
          setToken(token);
        }
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
        if (Platform.OS !== 'web') {
          SecureStore.setItemAsync('calendar_access_token', token);
        } else {
          localStorage.setItem('calendar_access_token', token);
        }
      }
    } else if (response?.type === 'error') {
      console.error('❌ Google Sign-In Error:', response.error);
    }
  }, [response]);

  const fontsLoaded = useFont();
  const router = useRouter();

  if (!fontsLoaded) {
    return (
      <View className="bg-primary flex-1 justify-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  const connectCalendar = () => {
    promptAsync();
  };

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
            too see mutual availability and
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
