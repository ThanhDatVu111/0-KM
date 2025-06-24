import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import icons from '@/constants/icons';
import useFont from '@/hooks/useFont';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, CodeChallengeMethod, Prompt } from 'expo-auth-session';
import { useAuth } from '@clerk/clerk-expo';

import {
  createRefreshToken,
  fetchNewAccessToken,
  checkRefreshToken,
  updateRefreshToken,
  fetchRefreshToken,
} from '@/apis/token';
import { fetchRoomByUserId } from '@/apis/room';
import { fetchCalendarEvents } from '@/apis/calendar';

import { Calendar, DateData } from 'react-native-calendars';

WebBrowser.maybeCompleteAuthSession();

// type CalendarEvent = {
//   id: string;
//   summary?: string;
//   start: { dateTime?: string; date?: string };
//   end: { dateTime?: string; date?: string };
// };

// type AgendaItem = {
//   name: string;
//   owner: 'me' | 'partner';
//   startTime: string;
//   endTime: string;
//   eventId: string;
//   height: number;
//   day: string;
// };

type FakeEvent = {
  id: string;
  title: string;
  time: string;
};

// 1) Define two dates with “fake” events:
const FAKE_EVENTS: Record<string, FakeEvent[]> = {
  '2025-06-07': [{ id: 'evt1', title: 'Morning Standup', time: '09:00 AM – 09:30 AM' }],
  '2025-06-08': [
    { id: 'evt2', title: 'Lunch w/ Partner', time: '12:00 PM – 01:00 PM' },
    { id: 'evt3', title: 'Project Demo', time: '03:00 PM – 04:00 PM' },
  ],
};

function GGCalendar() {
  const [userId] = useAuth();
  const todayKey = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  // --- NEW STATE FOR REAL EVENTS ---
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Room and partner IDs
  const [room_id, setRoomId] = useState('');
  const [other_user_id, setOtherUserId] = useState('');

  // Sync flags
  const [syncWithCalendar, setSyncWithCalendar] = useState(false);
  const [partnerSyncedWithCalendar, setPartnerSyncedWithCalendar] = useState(false);

  // Tokens for current user
  const [refresh_token, setRefreshToken] = useState('');
  const [access_token, setAccessToken] = useState('');

  // Tokens for partner
  const [other_refresh_token, setOtherRefreshToken] = useState('');
  const [other_access_token, setOtherAccessToken] = useState('');

  // A small set of hard‐coded events to show once both are connected:
  // const fakeItems: Record<string, AgendaItem[]> = {
  //   '2025-06-07': [
  //     {
  //       name: 'Morning Standup',
  //       owner: 'me',
  //       startTime: '09:00',
  //       endTime: '09:30',
  //       eventId: 'evt1',
  //       height: 60,
  //       day: '2025-06-07',
  //     },
  //     {
  //       name: 'Lunch with Partner',
  //       owner: 'partner',
  //       startTime: '12:00',
  //       endTime: '13:00',
  //       eventId: 'evt2',
  //       height: 60,
  //       day: '2025-06-07',
  //     },
  //   ],
  //   '2025-06-08': [
  //     {
  //       name: 'Project Demo',
  //       owner: 'me',
  //       startTime: '10:00',
  //       endTime: '11:00',
  //       eventId: 'evt3',
  //       height: 60,
  //       day: '2025-06-08',
  //     },
  //     {
  //       name: 'Coffee Break',
  //       owner: 'partner',
  //       startTime: '15:00',
  //       endTime: '15:30',
  //       eventId: 'evt4',
  //       height: 60,
  //       day: '2025-06-08',
  //     },
  //   ],
  // };

  const redirectUri = makeRedirectUri();
  const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID!;
  const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID!;
  const clientSecret = process.env.EXPO_PUBLIC_CLIENT_SECRET!;
  const { user_id } = useLocalSearchParams();
  const userId = 'user_2xpzayL53QL1tzrGzLoCXXF0FIz';

  const [request, response, promptAsync] = Google.useAuthRequest({
    redirectUri,
    iosClientId,
    webClientId,
    scopes: ['https://www.googleapis.com/auth/calendar'],
    responseType: 'code',
    clientSecret: clientSecret,
    codeChallengeMethod: CodeChallengeMethod.S256,
    extraParams: {
      access_type: 'offline',
      prompt: Prompt.Consent,
    },
  });

  console.log(response);
  if (response?.type === 'success') {
    console.log('refresh token:', response.authentication?.refreshToken);
  }
  // useEffect(() => {
  //   if (response?.type === 'success' && response.authentication) {
  //     // This is the correct place to access the refresh token
  //     console.log('refresh token:', response.authentication.refreshToken);
  //   }
  // }, [response]);

  // 1) Fetch room and partner ID on mount
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const room = await fetchRoomByUserId({ user_id: userId });
        setRoomId(room.room_id);
        setOtherUserId(room.other_user_id);
      } catch (err) {
        console.error('Error fetching room:', err);
      }
    })();
  }, [userId]);

  console.log(room_id);

  // 2) Check if partner is synced
  useEffect(() => {
    if (!other_user_id) return;
    (async () => {
      try {
        const partnerSynced = await checkRefreshToken({ user_id: other_user_id });
        setPartnerSyncedWithCalendar(Boolean(partnerSynced));
      } catch (err) {
        console.error('Error checking partner sync:', err);
      }
    })();
  }, [other_user_id]);

  // 3) If partner is synced, fetch their refresh token
  useEffect(() => {
    if (!partnerSyncedWithCalendar) return;
    (async () => {
      try {
        const partnerRT = await fetchRefreshToken({ user_id: other_user_id });
        // Fix: unwrap .data if present
        const refreshTokenValue =
          (partnerRT as any)?.data?.refresh_token || partnerRT?.refresh_token || '';
        setOtherRefreshToken(refreshTokenValue);
      } catch (err) {
        console.error('Error fetching partner refresh token:', err);
      }
    })();
  }, [partnerSyncedWithCalendar, other_user_id]);

  // 4) Exchange partner’s refresh token for an access token
  useEffect(() => {
    if (!other_refresh_token) return;
    (async () => {
      try {
        console.log('fetching partner access token');
        // Skip real fetch; just hard‐code:
        setOtherAccessToken('partner_access_token');
      } catch (err) {
        console.error('Error fetching partner access token:', err);
      }
    })();
  }, [other_refresh_token]);

  // 5) Check if current user is synced
  useEffect(() => {
    if (!room_id) return;
    (async () => {
      try {
        const meSynced = await checkRefreshToken({ user_id: userId });
        setSyncWithCalendar(Boolean(meSynced));
      } catch (err) {
        console.error('Error checking my sync:', err);
      }
    })();
  }, [room_id, userId]);

  // 6) If current user is synced, fetch their refresh token
  useEffect(() => {
    if (!syncWithCalendar) return;
    (async () => {
      try {
        const myRT = await fetchRefreshToken({ user_id: userId });
        // Fix: unwrap .data if present
        const refreshTokenValue = (myRT as any)?.data?.refresh_token || myRT?.refresh_token || '';
        setRefreshToken(refreshTokenValue);
      } catch (err) {
        console.error('Error fetching my refresh token:', err);
      }
    })();
  }, [syncWithCalendar]);

  console.log('refresh token: ', refresh_token);

  // 7) Exchange my refresh token for an access token
  useEffect(() => {
    if (!syncWithCalendar || !refresh_token) return;
    (async () => {
      try {
        setLoadingEvents(true);
        // Get a real access token from Google
        const tokenResp = await fetchNewAccessToken({
          client_id: webClientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token,
        });
        setAccessToken(tokenResp.access_token);
        console.log('access token: ', tokenResp.access_token);
      } catch (err) {
        setFetchError('Failed to get access token');
        console.error('Error fetching my access token:', err);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [refresh_token, syncWithCalendar]);

  // --- FETCH EVENTS WHEN ACCESS TOKEN IS AVAILABLE ---
  useEffect(() => {
    if (!access_token || !syncWithCalendar || !partnerSyncedWithCalendar) return;
    (async () => {
      setLoadingEvents(true);
      setFetchError(null);
      try {
        const events = await fetchCalendarEvents({ partnerAccessToken: access_token });
        setMyEvents(events);
      } catch (err) {
        setFetchError('Failed to fetch calendar events');
        setMyEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [access_token, syncWithCalendar, partnerSyncedWithCalendar]);

  // 8) Handle OAuth “code” response from Google
  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') console.error('Google Sign-In Error:', response.error);
      return;
    }
    (async () => {
      try {
        const refToken = response.authentication?.refreshToken;
        if (response.authentication?.refreshToken) {
          await updateRefreshToken({
            user_id: userId,
            refresh_token: refToken ?? '',
          });
          setRefreshToken(refToken ?? '');
          console.log('New refresh token:', refToken);
        } else {
          console.warn('No refresh_token in token response');
        }
      } catch (err) {
        console.error('Error exchanging code for tokens:', err);
      }
    })();
  }, [response, room_id, redirectUri, webClientId]);

  const markedDates: Record<string, any> = {};
  if (syncWithCalendar && partnerSyncedWithCalendar && myEvents.length > 0) {
    myEvents.forEach((ev) => {
      const dateKey = ev.start?.dateTime ? ev.start.dateTime.split('T')[0] : ev.start?.date;
      if (dateKey) {
        markedDates[dateKey] = {
          marked: true,
          dotColor: '#E91E63',
          activeOpacity: 0,
        };
      }
    });
  } else {
    Object.keys(FAKE_EVENTS).forEach((dateKey) => {
      markedDates[dateKey] = {
        marked: true,
        dotColor: '#E91E63',
        activeOpacity: 0,
      };
    });
  }
  // Also highlight the currently selected date
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: '#E91E63',
  };

  // 5) Pull out events for that date (real or fake):
  let eventsForDate: any[] = [];
  if (syncWithCalendar && partnerSyncedWithCalendar && myEvents.length > 0) {
    // Group events by date
    eventsForDate = myEvents
      .filter((ev) => {
        const dateKey = ev.start?.dateTime ? ev.start.dateTime.split('T')[0] : ev.start?.date;
        return dateKey === selectedDate;
      })
      .map((ev) => ({
        id: ev.id,
        title: ev.summary || '(No title)',
        time:
          ev.start?.dateTime && ev.end?.dateTime
            ? `${new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(ev.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'All Day',
      }));
  } else {
    // fallback to fake events
    eventsForDate = FAKE_EVENTS[selectedDate] || [];
  }

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const connectCalendar = async () => {
    try {
      await promptAsync();
    } catch (err) {
      console.error('Error during Google OAuth flow:', err);
    }
  };

  const fontsLoaded = useFont();
  const router = useRouter();

  if (!fontsLoaded) {
    return (
      <View
        style={{
          backgroundColor: '#222',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white' }}>Loading fonts…</Text>
      </View>
    );
  }

  // If user isn’t synced, show Connect UI
  if (!syncWithCalendar) {
    return (
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
    );
  }

  // If current user is synced but partner is not
  if (syncWithCalendar && !partnerSyncedWithCalendar) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16 }}>You’re synced. Waiting for your partner…</Text>
      </View>
    );
  }

  // In the render section, show loading/error if needed
  if (loadingEvents) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={{ marginTop: 12 }}>Loading events…</Text>
      </View>
    );
  }
  if (fetchError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>{fetchError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Calendar UI */}
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          calendarBackground: '#fff',
          todayTextColor: '#E91E63',
          dayTextColor: '#333',
          textDisabledColor: '#d9e1e8',
          monthTextColor: '#333',
          arrowColor: '#333',
        }}
      />

      {/* Below the calendar, show a header and list of fake events */}
      <View style={styles.eventsHeaderContainer}>
        <Text style={styles.eventsHeaderText}>
          {eventsForDate.length > 0 ? `Events on ${selectedDate}` : `No events on ${selectedDate}`}
        </Text>
      </View>

      <View style={styles.eventsListContainer}>
        {eventsForDate.map((evt) => (
          <View key={evt.id} style={styles.eventItem}>
            <Text style={styles.eventTitle}>{evt.title}</Text>
            <Text style={styles.eventTime}>{evt.time}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Basic styles for spacing
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  eventsHeaderContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  eventsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  eventsListContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  eventItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    shadowColor: '#00000020',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
  },
  eventTime: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
});

export default GGCalendar;
