import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
  ImageBackground,
  Dimensions,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import icons from '@/constants/icons';
import useFont from '@/hooks/useFont';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, CodeChallengeMethod, Prompt } from 'expo-auth-session';
import { useAuth } from '@clerk/clerk-expo';

import {
  fetchNewAccessToken,
  checkRefreshToken,
  updateRefreshToken,
  fetchRefreshToken,
} from '@/apis/token';
import { fetchRoomByUserId } from '@/apis/room';
import { fetchCalendarEvents, createCalendarEvent, createEvent } from '@/apis/calendar';
import { fetchUser } from '@/apis/user';

import { Calendar, DateData } from 'react-native-calendars';
import images from '@/constants/images';

const { width: SCREEN_W } = Dimensions.get('window');
const FRAME_W = SCREEN_W * 0.88; // 92% of screen width
const CALENDAR_W = FRAME_W * 0.85; // Calendar takes 85% of frame width
const CALENDAR_H = CALENDAR_W * 1.47; // Calendar height based on width (adjust ratio as needed)
const FRAME_H = CALENDAR_H + 60; // Frame height = calendar height + padding

/* margins */
const INNER_MARGIN = 12; // Increased horizontal margin

WebBrowser.maybeCompleteAuthSession();

function GGCalendar() {
  const { userId } = useAuth();
  const todayKey = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [activeTab, setActiveTab] = useState<'partner' | 'mutual'>('partner');

  // --- NEW STATE FOR REAL EVENTS ---
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [myOwnEvents, setMyOwnEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Room and partner IDs
  const [room_id, setRoomId] = useState('');
  const [other_user_id, setOtherUserId] = useState('');

  //emails
  const [user_email, setUserEmail] = useState('');
  const [partner_email, setPartnerEmail] = useState('');

  // Sync flags
  const [syncWithCalendar, setSyncWithCalendar] = useState(false);
  const [partnerSyncedWithCalendar, setPartnerSyncedWithCalendar] = useState(false);

  // Tokens for current user
  const [refresh_token, setRefreshToken] = useState('');
  const [access_token, setAccessToken] = useState('');

  // Tokens for partner
  const [other_refresh_token, setOtherRefreshToken] = useState('');
  const [other_access_token, setOtherAccessToken] = useState('');

  const redirectUri = makeRedirectUri({
    native:
      'com.googleusercontent.apps.152482242112-2c1othbu00qpt0725oki6u782hoppagj:/oauth2redirect/google',
  });
  console.log('redirect: ', redirectUri);
  const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID!;
  const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID!;
  const clientSecret = process.env.EXPO_PUBLIC_CLIENT_SECRET!;

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

  // 1) Fetch room and partner ID on mount
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const room = await fetchRoomByUserId({ user_id: userId });
        setRoomId(room.room_id);
        setOtherUserId(room.other_user_id);

        const user = await fetchUser(userId);
        setUserEmail(user.email);

        const partner = await fetchUser(other_user_id);
        setPartnerEmail(partner.email);
      } catch (err) {}
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
        const partnerAccessToken = await fetchNewAccessToken({
          client_id: webClientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: other_refresh_token,
        });
        setOtherAccessToken(partnerAccessToken.access_token);
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
        const meSynced = await checkRefreshToken({ user_id: userId ?? '' });
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
        const myRT = await fetchRefreshToken({ user_id: userId ?? '' });
        // Fix: unwrap .data if present
        const refreshTokenValue = (myRT as any)?.data?.refresh_token || myRT?.refresh_token || '';
        setRefreshToken(refreshTokenValue);
      } catch (err) {
        console.error('Error fetching my refresh token:', err);
      }
    })();
  }, [syncWithCalendar]);

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
        // Fetch partner's events
        const partnerEvents = await fetchCalendarEvents({ partnerAccessToken: other_access_token });
        setMyEvents(partnerEvents);
        // Fetch my own events
        const myEventsResp = await fetchCalendarEvents({ partnerAccessToken: access_token });
        setMyOwnEvents(myEventsResp);
      } catch (err) {
        setFetchError('Failed to fetch calendar events');
        setMyEvents([]);
        setMyOwnEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [access_token, syncWithCalendar, partnerSyncedWithCalendar, other_access_token]);

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
            user_id: userId ?? '',
            refresh_token: refToken ?? '',
          });
          setRefreshToken(refToken ?? '');
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
  }
  // Also highlight the currently selected date
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: '#E91E63',
  };

  // 5) Pull out events for that date (real or fake):
  let eventsForDate: any[] = [];
  let myOwnEventsForDate: any[] = [];
  if (syncWithCalendar && partnerSyncedWithCalendar && myEvents.length > 0) {
    // Group events by date using local time
    eventsForDate = myEvents
      .filter((ev) => {
        let dateKey = '';
        if (ev.start?.dateTime) {
          dateKey = new Date(ev.start.dateTime).toLocaleDateString('en-CA');
        } else if (ev.start?.date) {
          dateKey = ev.start.date;
        }
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
    myOwnEventsForDate = myOwnEvents
      ? myOwnEvents
          .filter((ev) => {
            let dateKey = '';
            if (ev.start?.dateTime) {
              dateKey = new Date(ev.start.dateTime).toLocaleDateString('en-CA');
            } else if (ev.start?.date) {
              dateKey = ev.start.date;
            }
            return dateKey === selectedDate;
          })
          .map((ev) => ({
            id: ev.id,
            title: ev.summary || '(No title)',
            time:
              ev.start?.dateTime && ev.end?.dateTime
                ? `${new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(ev.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'All Day',
          }))
      : [];
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

  // --- Modal state for scheduling ---
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const handleScheduleEvent = async () => {
    if (!selectedSlot || !eventTitle) return;
    setScheduling(true);
    try {
      // Parse slot to get start/end time
      const [hour, min] = selectedSlot.split(':').map(Number);
      const startDate = new Date(
        selectedDate + `T${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`,
      );
      const endDate = new Date(startDate.getTime() + 30 * 60000);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

      const attendees = [
        {
          email: partner_email,
        },
      ];

      const event = {
        summary: eventTitle,
        description: eventDescription,
        start: { dateTime: startDate.toISOString(), timeZone },
        end: { dateTime: endDate.toISOString(), timeZone },
        attendees: attendees,
        conferenceData: {
          createRequest: {
            requestId: `${userId || 'user'}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };
      // Create event for both users, send email
      await Promise.all([
        createCalendarEvent({ accessToken: access_token, event, sendUpdates: 'all' }),
      ]);

      await createEvent({
        room_id: room_id,
        user_1: userId ?? '',
        user_2: other_user_id,
        start_time: event.start.dateTime,
        start_timezone: event.start.timeZone,
        end_time: event.end.dateTime,
        end_timezone: event.end.timeZone,
        title: eventTitle,
      });

      setModalVisible(false);
      setEventTitle('');
      setEventDescription('');
      setSelectedSlot(null);
      Alert.alert('Success', 'Event scheduled for both calendars!');
      // Optionally, refresh events
      setLoadingEvents(true);
      setFetchError(null);
      try {
        const partnerEvents = await fetchCalendarEvents({ partnerAccessToken: other_access_token });
        setMyEvents(partnerEvents);
        const myEventsResp = await fetchCalendarEvents({ partnerAccessToken: access_token });
        setMyOwnEvents(myEventsResp);
      } catch (err) {
        setFetchError('Failed to fetch calendar events');
        setMyEvents([]);
        setMyOwnEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to schedule event');
    } finally {
      setScheduling(false);
    }
  };

  const fontsLoaded = useFont();

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

  // --- Mutual Free Time Calculation ---
  function getTimeSlots(start = 0, end = 24, interval = 30): string[] {
    const slots = [];
    for (let hour = start; hour < end; hour++) {
      for (let min = 0; min < 60; min += interval) {
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  }

  // Merge overlapping or adjacent intervals
  function mergeIntervals(
    intervals: { start: number; end: number }[],
  ): { start: number; end: number }[] {
    if (intervals.length === 0) return [];
    // Sort by start time
    intervals.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    for (const curr of intervals) {
      if (!merged.length || merged[merged.length - 1].end < curr.start) {
        merged.push({ ...curr });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, curr.end);
      }
    }

    return merged;
  }

  // Check if a slot is busy given busy intervals
  function isSlotBusyRaw(slot: string, busyIntervals: { start: number; end: number }[]): boolean {
    const [slotHour, slotMin] = slot.split(':').map(Number);
    const slotStart = slotHour * 60 + slotMin;
    const slotEnd = slotStart + 30;
    return busyIntervals.some(({ start, end }) => slotStart < end && slotEnd > start);
  }

  // Parse busy intervals from raw event data
  function getBusyIntervals(events: any[]): { start: number; end: number }[] {
    const intervals: { start: number; end: number }[] = [];
    for (const ev of events) {
      // Only print raw event if it is relevant to the selectedDate
      let isRelevant = false;
      if (ev.start?.date && !ev.start?.dateTime) {
        const startDate = ev.start.date;
        const endDate = ev.end?.date;
        if (selectedDate >= startDate && endDate && selectedDate < endDate) {
          isRelevant = true;
        }
      } else if (ev.start?.dateTime && ev.end?.dateTime) {
        // Use local time for comparison
        const startDate = new Date(ev.start.dateTime);
        const endDate = new Date(ev.end.dateTime);
        // Convert selectedDate to local midnight
        const selectedDateObj = new Date(selectedDate + 'T00:00:00');
        // Event is relevant if it overlaps with the selected day (local time)
        if (
          startDate < new Date(selectedDateObj.getTime() + 24 * 60 * 60 * 1000) &&
          endDate > selectedDateObj
        ) {
          isRelevant = true;
        }
      }

      // All day event
      if (ev.start?.date && !ev.start?.dateTime) {
        const startDate = ev.start.date;
        const endDate = ev.end?.date;
        if (selectedDate >= startDate && endDate && selectedDate < endDate) {
          intervals.push({ start: 0, end: 24 * 60 });
        }
        continue;
      }
      // Timed event
      const startStr = ev.start?.dateTime;
      const endStr = ev.end?.dateTime;
      if (startStr && endStr) {
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);
        // Convert selectedDate to local midnight
        const selectedDateObj = new Date(selectedDate + 'T00:00:00');
        const nextDateObj = new Date(selectedDateObj.getTime() + 24 * 60 * 60 * 1000);
        // If event does not overlap with selected day, skip
        if (startDate >= nextDateObj || endDate <= selectedDateObj) continue;
        // Calculate busy interval within the selected day
        const busyStart = Math.max(startDate.getTime(), selectedDateObj.getTime());
        const busyEnd = Math.min(endDate.getTime(), nextDateObj.getTime());
        const startMin = Math.floor((busyStart - selectedDateObj.getTime()) / 60000);
        const endMin = Math.floor((busyEnd - selectedDateObj.getTime()) / 60000);
        if (endMin > startMin) {
          intervals.push({ start: startMin, end: endMin });
        }
      }
    }

    return mergeIntervals(intervals);
  }

  // Debug: print mutual free slots
  let mutualFreeSlots: string[] = [];
  if (syncWithCalendar && partnerSyncedWithCalendar) {
    const slots = getTimeSlots();
    const myBusy = getBusyIntervals(myOwnEvents);
    const partnerBusy = getBusyIntervals(myEvents);
    // If either has an all-day event, no mutual free slots
    if (
      myBusy.some((b) => b.start === 0 && b.end === 24 * 60) ||
      partnerBusy.some((b) => b.start === 0 && b.end === 24 * 60)
    ) {
      mutualFreeSlots = [];
    } else {
      mutualFreeSlots = slots.filter(
        (slot) => !isSlotBusyRaw(slot, myBusy) && !isSlotBusyRaw(slot, partnerBusy),
      );
    }
  }

  // --- Tab UI ---
  return (
    <ImageBackground
      source={images.Background}
      style={{ flex: 1 }} // <— key line
      resizeMode="contain"
    >
      <View style={styles.container}>
        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'partner' && styles.tabButtonActive]}
            onPress={() => setActiveTab('partner')}
          >
            <Text style={[styles.tabText, activeTab === 'partner' && styles.tabTextActive]}>
              Partner's Schedule
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'mutual' && styles.tabButtonActive]}
            onPress={() => setActiveTab('mutual')}
          >
            <Text style={[styles.tabText, activeTab === 'mutual' && styles.tabTextActive]}>
              Compare Schedule
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Calendar UI */}
          <ImageBackground
            source={images.Frame}
            resizeMode="stretch" // ⬅ Changed to "stretch" to fit our custom dimensions
            style={styles.frame}
          >
            <View style={styles.inner}>
              <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                style={styles.calendar}
                theme={{
                  calendarBackground: 'transparent',
                  todayTextColor: '#E91E63',
                  dayTextColor: '#333',
                  textDisabledColor: '#d9e1e8',
                  monthTextColor: '#333',
                  arrowColor: '#333',
                  textDayFontSize: 16, // Increase font size for better visibility
                  textMonthFontSize: 18,
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontSize: 14,
                  textMonthFontFamily: 'Poppins-Light',
                  textDayFontFamily: 'Poppins-Light',
                  textDayHeaderFontFamily: 'Poppins-Light',
                }}
              />
            </View>
          </ImageBackground>

          {/* Tab Content */}
          {activeTab === 'partner' ? (
            <View>
              {/* Below the calendar, show a header and list of partner's events */}
              <View style={styles.eventsHeaderContainer}>
                <Text style={styles.eventsHeaderText}>
                  {eventsForDate.length > 0
                    ? `Events on ${selectedDate}`
                    : `No events on ${selectedDate}`}
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
          ) : (
            <View style={{ flexDirection: 'column', paddingHorizontal: 35, marginTop: 16 }}>
              <View style={{ flexDirection: 'row' }}>
                {/* My Events */}
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      marginBottom: 8,
                      color: '#8b0000',
                      fontSize: 18,
                      fontFamily: 'Poppins-Medium',
                    }}
                  >
                    You
                  </Text>
                  {myOwnEventsForDate.length > 0 ? (
                    myOwnEventsForDate.map((evt) => (
                      <View key={evt.id} style={styles.eventItem}>
                        <Text style={styles.eventTitle}>{evt.title}</Text>
                        <Text style={styles.eventTime}>{evt.time}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: '#dce2f1' }}>No events</Text>
                  )}
                </View>
                {/* Partner's Events */}
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      marginBottom: 8,
                      color: '#aadffc',
                      fontSize: 18,
                      fontFamily: 'Poppins-Medium',
                    }}
                  >
                    Partner
                  </Text>
                  {eventsForDate.length > 0 ? (
                    eventsForDate.map((evt) => (
                      <View key={evt.id} style={styles.eventItem}>
                        <Text style={styles.eventTitle}>{evt.title}</Text>
                        <Text style={styles.eventTime}>{evt.time}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: '#dce2f1' }}>No events</Text>
                  )}
                </View>
              </View>
              {/* Mutual Free Time */}
              <View
                style={{ marginTop: 24, alignItems: 'center', width: '100%', marginBottom: 20 }}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    fontSize: 18,
                    marginBottom: 8,
                    color: '#c7edcc',
                    fontFamily: 'Poppins-Medium',
                  }}
                >
                  Mutual Free Time
                </Text>
                {mutualFreeSlots.length > 0 ? (
                  <View
                    style={{
                      justifyContent: 'flex-start',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        width: '100%',
                      }}
                    >
                      {mutualFreeSlots.map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          onPress={() => {
                            setSelectedSlot(slot);
                            setModalVisible(true);
                          }}
                          disabled={scheduling}
                          style={{ opacity: scheduling ? 0.5 : 1 }}
                        >
                          <View
                            style={{
                              backgroundColor: '#FFC6F9',
                              borderRadius: 6,
                              padding: 12,
                              margin: 5,
                              minWidth: 100,
                              alignItems: 'center',
                              opacity: 0.8,
                            }}
                          >
                            <Text style={{ color: '#00796B', fontWeight: 'bold' }}>
                              {slot} -{' '}
                              {`${(Number(slot.split(':')[0]) + (Number(slot.split(':')[1]) + 30 >= 60 ? 1 : 0)).toString().padStart(2, '0')}:${((Number(slot.split(':')[1]) + 30) % 60).toString().padStart(2, '0')}`}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={{ color: '#888' }}>No mutual free slots</Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: '#00000099',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ImageBackground
              source={images.Frame}
              resizeMode="stretch"
              style={{
                alignSelf: 'center',
              }}
            >
              {/* Empty container that defines the modal frame size */}
              <View
                style={{
                  width: SCREEN_W * 0.85, // 85% of screen width
                  height: 300, // Fixed height for modal
                }}
              >
                <View
                  style={{
                    flex: 1,
                    paddingHorizontal: 40,
                    paddingTop: 40,
                    paddingBottom: 70,
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    overflow: 'hidden',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: 'bold',
                      fontSize: 18,
                      marginBottom: 5,
                      textAlign: 'left',
                      color: '#333',
                      fontFamily: 'Poppins-Light',
                    }}
                  >
                    Schedule Event
                  </Text>

                  <Text
                    style={{
                      marginBottom: 8,
                      textAlign: 'left',
                      color: '#666',
                      fontFamily: 'Poppins-Light',
                    }}
                  >
                    Time: {selectedSlot} -{' '}
                    {selectedSlot &&
                      `${(Number(selectedSlot.split(':')[0]) + (Number(selectedSlot.split(':')[1]) + 30 >= 60 ? 1 : 0)).toString().padStart(2, '0')}:${((Number(selectedSlot.split(':')[1]) + 30) % 60).toString().padStart(2, '0')}`}
                  </Text>

                  <TextInput
                    placeholder="Event Title"
                    value={eventTitle}
                    onChangeText={setEventTitle}
                    style={{
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 6,
                      padding: 8,
                      marginBottom: 12,
                      backgroundColor: '#fff',
                      fontFamily: 'Poppins-Light',
                    }}
                    editable={!scheduling}
                  />

                  <TextInput
                    placeholder="Description (optional)"
                    value={eventDescription}
                    onChangeText={setEventDescription}
                    style={{
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 6,
                      padding: 8,
                      marginBottom: 12,
                      minHeight: 40,
                      backgroundColor: '#fff',
                      fontFamily: 'Poppins-Light',
                    }}
                    editable={!scheduling}
                    multiline
                  />

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      marginTop: 'auto',
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={{
                        justifyContent: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 18,
                        borderRadius: 6,
                        backgroundColor: 'transparent',
                      }}
                      disabled={scheduling}
                    >
                      <Text
                        style={{
                          color: '#666',
                          fontWeight: 'bold',
                          fontFamily: 'Poppins-Light',
                        }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleScheduleEvent}
                      disabled={scheduling || !eventTitle}
                      style={{
                        backgroundColor: '#E91E63',
                        borderRadius: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 18,
                        opacity: scheduling || !eventTitle ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          fontWeight: 'bold',
                          fontFamily: 'Poppins-Light',
                        }}
                      >
                        {scheduling ? 'Scheduling...' : 'Schedule'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

// Basic styles for spacing
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    fontFamily: 'Poppins-Light',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Poppins-Medium',
  },
  eventTime: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
    fontFamily: 'Poppins-Light',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginHorizontal: 8,
    marginTop: 8,
  },
  tabButtonActive: {
    backgroundColor: '#E91E63',
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Poppins-Light',
  },
  tabTextActive: {
    color: '#fff',
  },
  frame: {
    width: FRAME_W,
    height: FRAME_H,
    alignSelf: 'center',
  },
  inner: {
    height: 500,
    flex: 1,
    paddingHorizontal: INNER_MARGIN,
    paddingTop: 100,
    paddingBottom: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  calendar: {
    marginTop: 30,
    marginBottom: 15,
    width: CALENDAR_W, // ⬅ Specific width for calendar
    height: CALENDAR_H, // ⬅ Specific height for calendar
    backgroundColor: 'transparent',
  },
});

export default GGCalendar;
