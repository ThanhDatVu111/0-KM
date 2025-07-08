import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { pairRoom, deleteRoom } from '@/apis/room';
import { SignOutButton } from '@/components/SignOutButton';
import FormInput from '@/components/FormInput';
import images from '@/constants/images';
import { useAuth } from '@clerk/clerk-expo';
import { fetchRoom } from '@/apis/room';
import { createRoom } from '@/apis/room';
import uuid from 'react-native-uuid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
);

function PairingStep({
  myCode,
  setPartnerCode,
  partnerCode,
  onFinish,
  error,
  loading,
}: {
  myCode: string;
  partnerCode: string;
  setPartnerCode: (s: string) => void;
  onFinish: () => void;
  error: string;
  loading: boolean;
}) {
  const handleCopy = async () => {
    if (!myCode || myCode.length === 0) {
      Alert.alert('Error', 'No code available to copy.');
      return;
    }
    await Clipboard.setStringAsync(myCode);
    Alert.alert('Copied', 'Invite code copied to clipboard!');
  };

  return (
    <View className="w-11/12 max-w-md shadow-2xl border-4 border-black rounded-lg">
      {/* Purple Header Section */}
      <View className="bg-[#6536DD] border-b-4 border-black px-4 py-6 items-center rounded-t-md">
        <View className="relative">
          {/* So it renders 4 <Text> components: 1 for each corner */}
          {[
            [-3, 0],
            [3, 0],
            [0, -3],
            [0, 3],
          ].map(([dx, dy], index) => (
            <Text
              key={index}
              style={{
                position: 'absolute',
                fontFamily: 'PressStart2P',
                fontSize: 24,
                color: 'white',
                left: dx,
                top: dy,
              }}
            >
              Pairing
            </Text>
          ))}

          {/* Foreground Red Text */}
          <Text
            style={{
              fontFamily: 'PressStart2P',
              fontSize: 24,
              color: '#F24187',
            }}
          >
            Pairing
          </Text>
        </View>
      </View>

      {/* White Form Section */}
      <View className="bg-white px-8 py-8 rounded-b-md">
        {/* Your Code Section */}
        <View className="mb-6">
          <Text
            className="text-[#6536DD] text-lg font-bold text-center mb-4"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            YOUR INVITE CODE
          </Text>

          <View className="bg-[#F3EEFF] border-2 border-[#6536DD] rounded-lg p-4 mb-4">
            <Text
              className="text-[#6536DD] text-xl font-bold text-center"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              {myCode}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCopy}
            className="w-full mb-4 bg-white border-4 border-[#6536DD]"
            style={{
              shadowColor: '#6536DD',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
            }}
          >
            <View className="bg-white px-4 py-3">
              <Text
                className="text-[#6536DD] text-center text-[16px] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                COPY INVITE CODE
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <Text
          className="text-gray-600 text-center mb-6 text-lg"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          OR
        </Text>

        {/* Partner Code Section */}
        <View className="mb-6">
          <Text
            className="text-[#6536DD] text-lg font-bold text-center mb-4"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            ENTER PARTNER INVITE CODE
          </Text>
          <FormInput
            borderColor="#6536DD"
            value={partnerCode}
            placeholder="Enter code here"
            onChangeText={setPartnerCode}
            maxLength={40}
          />

          <TouchableOpacity
            onPress={onFinish}
            disabled={loading || !partnerCode.trim()}
            className="w-full mb-4 bg-[#6536DD] border-4 border-black"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
              opacity: loading || !partnerCode.trim() ? 0.5 : 1,
            }}
          >
            <View className="bg-[#6536DD] px-4 py-3">
              <Text
                className="text-white text-center text-[16px] font-bold"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                {loading ? 'PAIRING...' : 'PAIR NOW'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error ? (
          <Text className="text-red-600 text-center mb-4" style={{ fontFamily: 'Poppins-Regular' }}>
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const JoinRoom = () => {
  const router = useRouter();
  const [partnerCode, setPartnerCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const { userId } = useAuth();

  // Single useEffect to handle room creation/fetching
  useEffect(() => {
    if (!userId) return;

    const initializeRoom = async () => {
      try {
        console.log('🔍 Checking for existing room for user:', userId);
        const existingRoom = await fetchRoom({ user_id: userId });
        console.log('🔍 Found existing room:', existingRoom.room_id);
        setRoomId(existingRoom.room_id);
      } catch (err: any) {
        if (err.message && err.message.includes('Room not found')) {
          console.log('🔍 No existing room found, creating new room');
          const newRoomId = uuid.v4() as string;
          const room = await createRoom({
            room_id: newRoomId,
            user_1: userId,
          });
          console.log('✅ Room created:', room.room_id);
          setRoomId(room.room_id);
        } else {
          console.error('❌ Error checking for room:', err);
        }
      }
    };

    initializeRoom();
  }, [userId]); // Only depend on userId

  // Realtime subscription to detect when someone joins this user's room
  useEffect(() => {
    if (!roomId || !userId) return;

    console.log('🔴 SETTING UP JOIN-ROOM SUBSCRIPTION for room:', roomId);
    console.log('🔴 User:', userId);

    const channel = supabase
      .channel(`join-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload: any) => {
          console.log('🟢 JOIN-ROOM: Realtime event received:', payload);

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            const users = [updated.user_1, updated.user_2].filter(Boolean);

            console.log('🟢 JOIN-ROOM: Users in room after update:', users);
            console.log('🟢 JOIN-ROOM: Room is now filled?', users.length === 2);

            // If room now has 2 users and current user is one of them, navigate to home
            if (users.length === 2 && users.includes(userId)) {
              console.log('🟢 JOIN-ROOM: Room is full! Navigating to home...');
              Alert.alert('Success', 'You have been paired with your partner!', [
                {
                  text: 'OK',
                  onPress: () => {
                    router.push({ pathname: '/(tabs)/home', params: { userId } });
                  },
                },
              ]);
            }
          }
        },
      )
      .subscribe((status) => {
        console.log('🔵 JOIN-ROOM SUBSCRIPTION STATUS:', status);
        console.log('🔵 JOIN-ROOM: User:', userId, 'subscribed to room:', roomId);
      });

    return () => {
      console.log('🔴 JOIN-ROOM: Unsubscribing from room:', roomId);
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  const roomIdString = Array.isArray(roomId) ? roomId[0] : roomId;
  const connectRoom = async () => {
    if (partnerCode === roomIdString) {
      setError('Cannot enter your own code');
      return;
    }

    setLoading(true);
    try {
      console.log('Moving user:', Array.isArray(userId) ? userId[0] : userId);
      console.log('Moving to room:', partnerCode);

      await pairRoom({
        room_id: partnerCode,
        user_id: Array.isArray(userId) ? userId[0] : userId,
      });

      console.log('Deleting room with ID:', roomIdString);

      await deleteRoom({
        room_id: roomIdString,
      });

      console.log('Paired with partner successfully!');
      // Don't show alert here - let the realtime subscription handle navigation
      router.push({ pathname: '/(tabs)/home', params: { userId } });
    } catch (err) {
      console.error('Pairing failed:', err);
      setError('Failed to pair with your partner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={images.onboardPairingBg}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 items-center justify-center px-4 py-8">
            <View className="absolute top-12 right-4">
              <SignOutButton />
            </View>
            <PairingStep
              myCode={roomIdString}
              partnerCode={partnerCode}
              setPartnerCode={setPartnerCode}
              onFinish={connectRoom}
              error={error}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default JoinRoom;
