import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import icons from '@/constants/icons';
import useFont from '@/hooks/useFont';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, CodeChallengeMethod } from 'expo-auth-session';

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
  const todayKey = new Date().toISOString().split('T')[0];

  // 2) Keep track of the currently selected date (YYYY-MM-DD):
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  // 3) Build a “markedDates” object so the two days appear highlighted:
  const markedDates: Record<string, any> = {};
  Object.keys(FAKE_EVENTS).forEach((dateKey) => {
    markedDates[dateKey] = {
      marked: true,
      dotColor: '#E91E63',
      activeOpacity: 0,
    };
  });
  // Also highlight the currently selected date
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: '#E91E63',
  };

  // 4) When the user taps a day, update selectedDate:
  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  // 5) Pull out “fake” events for that date (if any):
  const eventsForDate = FAKE_EVENTS[selectedDate] || [];

  const redirectUri = makeRedirectUri();
  const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID!;
  const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID!;
  const clientSecret = process.env.EXPO_PUBLIC_CLIENT_SECRET!;
  const { user_id } = useLocalSearchParams();
  const userId = 'user_2xpzayL53QL1tzrGzLoCXXF0FIz';

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

  // Fetched events (we’ll ignore these once we switch to fake data)
  // const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  // const [partnerEvents, setPartnerEvents] = useState<CalendarEvent[]>([]);
  // const [loadingEvents, setLoadingEvents] = useState(false);

  // Agenda items (only used if we were doing real fetches)
  // const [itemsByDate, setItemsByDate] = useState<Record<string, AgendaItem[]>>({});

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

  console.log('user id:', userId);
  console.log('redirect:', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    redirectUri,
    iosClientId,
    webClientId,
    scopes: ['https://www.googleapis.com/auth/calendar'],
    responseType: 'code',
    clientSecret: clientSecret,
    codeChallengeMethod: CodeChallengeMethod.S256,
  });

  console.log('code verifier: ', request?.codeVerifier);
  console.log('code challenge: ', request?.codeChallenge);

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
        setOtherRefreshToken(partnerRT?.refresh_token ?? '');
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
        setRefreshToken(myRT?.refresh_token ?? '');
      } catch (err) {
        console.error('Error fetching my refresh token:', err);
      }
    })();
  }, [syncWithCalendar, userId]);

  // 7) Exchange my refresh token for an access token
  useEffect(() => {
    if (!syncWithCalendar || !refresh_token) return;
    (async () => {
      try {
        console.log('fetching user new access token');
        // Skip real fetch; just hard‐code:
        setAccessToken('user_access_token');
      } catch (err) {
        console.error('Error fetching my access token:', err);
      }
    })();
  }, [refresh_token, syncWithCalendar]);

  // 8) Handle OAuth “code” response from Google
  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') console.error('Google Sign-In Error:', response.error);
      return;
    }
    (async () => {
      try {
        const authCode = response.params.code;
        console.log('Authorization Code:', authCode);

        if (!webClientId) throw new Error('Missing Google Web Client ID');

        console.log('Redirect URI:', redirectUri);
        console.log('Code Verifier:', request?.codeVerifier);

        // Skip real token exchange; just hard‐code a new refresh token:
        const fakeRT = 'abcxyz';
        await updateRefreshToken({
          user_id: userId,
          refresh_token: fakeRT,
        });
        setRefreshToken(fakeRT);
      } catch (err) {
        console.error('Error exchanging code for tokens:', err);
      }
    })();
  }, [response, room_id, redirectUri, webClientId]);

  // (We’ve commented out the “fetch events” step entirely, since we’re showing fakeItems.)

  // 10) Build itemsByDate for Agenda (only if we had real events)
  // useEffect(() => {
  //   const items: Record<string, AgendaItem[]> = {};

  //   function isoToYmd(iso: string) {
  //     return iso.split('T')[0];
  //   }
  //   function isoToTime(iso: string) {
  //     const t = iso.split('T')[1] || '';
  //     return t.substring(0, 5);
  //   }
  //   function addEventToDate(ev: CalendarEvent, owner: 'me' | 'partner') {
  //     const startIso = ev.start.dateTime ?? ev.start.date ?? '';
  //     if (!startIso) return;
  //     const dateKey = isoToYmd(startIso);

  //     const sTime = ev.start.dateTime ? isoToTime(ev.start.dateTime) : 'All Day';
  //     const eTime = ev.end.dateTime ? isoToTime(ev.end.dateTime) : '';

  //     const item: AgendaItem = {
  //       name: ev.summary || '(No title)',
  //       owner,
  //       startTime: sTime,
  //       endTime: eTime,
  //       eventId: ev.id,
  //       height: 60,
  //       day: dateKey,
  //     };

  //     if (!items[dateKey]) {
  //       items[dateKey] = [];
  //     }
  //     items[dateKey].push(item);
  //   }

  //   myEvents.forEach((ev) => addEventToDate(ev, 'me'));
  //   partnerEvents.forEach((ev) => addEventToDate(ev, 'partner'));

  //   Object.keys(items).forEach((dateKey) => {
  //     items[dateKey].sort((a, b) => {
  //       if (a.startTime === 'All Day') return -1;
  //       if (b.startTime === 'All Day') return 1;
  //       return a.startTime.localeCompare(b.startTime);
  //     });
  //   });

  //   setItemsByDate(items);
  // }, [myEvents, partnerEvents]);

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
