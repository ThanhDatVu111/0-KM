import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import React, { use } from 'react';
import icons from '@/constants/icons';
import useFont from '@/hooks/useFont';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect } from 'react';
import { GrantType, makeRedirectUri } from 'expo-auth-session';
import {
  createRefreshToken,
  fetchNewAccessToken,
  checkRefreshToken,
  updateRefreshToken,
  fetchRefreshToken,
} from '@/apis/token';
import { fetchRoomByUserId } from '@/apis/room';
import { useLocalSearchParams } from 'expo-router';
WebBrowser.maybeCompleteAuthSession();

const Calendar = () => {
  const [accessToken, setToken] = useState<String | null>(null);
  const redirectUri = makeRedirectUri();
  const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
  const { user_id } = useLocalSearchParams();
  const [room_id, setRoomId] = useState('');
  const [other_user_id, setOtherUserId] = useState('');
  const [syncWithCalendar, setSyncWithCalendar] = useState(false);
  const [partnerSyncedWithCalendar, setPartnerSyncedWithCalendar] = useState(false);
  const [refresh_token, setRefreshToken] = useState('');
  const [access_token, setAccessToken] = useState('');
  const [other_refresh_token, setOtherRefreshToken] = useState('');
  const [other_access_token, setOtherAccessToken] = useState('');

  console.log('redirect:', redirectUri);
  const [request, response, promptAsync] = Google.useAuthRequest({
    redirectUri: redirectUri,
    iosClientId: iosClientId,
    webClientId: webClientId,
    scopes: ['https://www.googleapis.com/auth/calendar'],
    responseType: 'code',
  });

  useEffect(() => {
    (async () => {
      const response = await fetchRoomByUserId({
        user_id: Array.isArray(user_id) ? user_id[0] : user_id,
      });
      setRoomId(response.room_id);
      setOtherUserId(response.other_user_id);
    })();
  }, [user_id]);

  useEffect(() => {
    (async () => {
      const checkSyncPartner = await checkRefreshToken({
        user_id: Array.isArray(other_user_id) ? other_user_id[0] : other_user_id,
      });
      setPartnerSyncedWithCalendar(checkSyncPartner?.valueOf() ?? false);
    })();
  }, [other_user_id]);

  useEffect(() => {
    (async () => {
      if (partnerSyncedWithCalendar == true) {
        const partnerRefreshToken = await fetchRefreshToken({
          user_id: other_user_id,
        });
        setOtherRefreshToken(partnerRefreshToken?.refresh_token ?? '');
      }
    })();
  }, [partnerSyncedWithCalendar]);

  useEffect(() => {
    (async () => {
      if (other_refresh_token) {
        const partnerTokens = await fetchNewAccessToken({
          refresh_token: other_refresh_token,
          client_id: webClientId ?? '',
          client_secret: process.env.EXPO_PUBLIC_CLIENT_SECRET ?? '',
          grant_type: 'refresh_token',
        });
        setOtherAccessToken(partnerTokens.access_token);
      }
    })();
  }, [other_refresh_token]);

  useEffect(() => {
    (async () => {
      if (syncWithCalendar == true) {
        const refreshToken = await fetchRefreshToken({
          user_id: Array.isArray(user_id) ? user_id[0] : user_id,
        });
        setRefreshToken(refreshToken?.refresh_token ?? '');
      }
    })();
  }, [syncWithCalendar]);

  useEffect(() => {
    (async () => {
      const checkSync = await checkRefreshToken({
        user_id: Array.isArray(user_id) ? user_id[0] : user_id,
      });
      setSyncWithCalendar(checkSync?.valueOf() ?? false);
    })();
  }, [room_id, user_id]);

  useEffect(() => {
    (async () => {
      if (syncWithCalendar == true) {
        const newAccessToken = await fetchNewAccessToken({
          refresh_token: refresh_token,
          client_id: webClientId ?? '',
          client_secret: process.env.EXPO_PUBLIC_CLIENT_SECRET ?? '',
          grant_type: 'refresh_token',
        });
        setAccessToken(newAccessToken.access_token);
      }
    })();
  }, [refresh_token, syncWithCalendar]);

  useEffect(() => {
    const handleAuthResponse = async () => {
      if (response?.type === 'success') {
        const authCode = response.params.code;
        if (!webClientId) {
          throw new Error('Missing Google Web Client ID');
        }
        const token = await createRefreshToken({
          client_id: webClientId,
          code: authCode,
          client_secret: process.env.EXPO_PUBLIC_CLIENT_SECRET ?? '',
          redirect_uri: makeRedirectUri(),
        });

        updateRefreshToken({
          room_id: room_id,
          refresh_token: token.refresh_token,
        });

        setRefreshToken(token.refresh_token);
      } else if (response?.type === 'error') {
        console.error('❌ Google Sign-In Error:', response.error);
      }
    };

    handleAuthResponse();
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
      {syncWithCalendar ? (
        partnerSyncedWithCalendar ? (
          // Both users are synced → render your calendar UI here
          <View>
            <Text>Your calendar (and partner’s) is synced—show group schedule.</Text>
            {/* …plumb in your calendar component using accessToken… */}
          </View>
        ) : (
          // This user is synced, but partner is not
          <View>
            <Text>Already synced with calendar. Waiting for partner…</Text>
          </View>
        )
      ) : (
        // This user is not synced, so prompt them
        <View className="tab-screen" style={{ padding: 20 }}>
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}>Connect to</Text>
          <Image
            source={icons.googleCalendar}
            style={{ width: '100%', height: 100 }}
            resizeMode="contain"
          />
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}>
            to see mutual availability and
          </Text>
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}>
            schedule your next virtual date
          </Text>
          <TouchableOpacity
            onPress={connectCalendar}
            className="bg-calendarButton h-10 w-40 rounded-lg items-center mt-12 justify-center"
            style={{ alignSelf: 'center' }}
          >
            <Text style={{ color: 'white', fontFamily: 'Poppins-SemiBold' }}>Connect</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Calendar;
