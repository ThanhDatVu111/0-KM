import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Button from '@/components/Button';
import { View, Text, TextInput, Alert, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { pairRoom, deleteRoom } from '@/apis/room';

function PairingStep({
  myCode,
  setPartnerCode,
  partnerCode,
  onFinish,
  error,
}: {
  myCode: string;
  partnerCode: string;
  setPartnerCode: (s: string) => void;
  onFinish: () => void;
  error: string;
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
    <View className="w-full max-w-xs items-center px-6">
      {/* Logo */}
      <Image source={require('@/assets/images/logo.png')} className="w-20 h-20 mb-6" />

      <Text className="text-2xl font-semibold text-gray-800 mb-8">Pair with your partner</Text>

      <View className="w-full bg-white/20 rounded-3xl p-6 mb-4">
        <Text className="text-xl font-medium text-gray-800 mb-2 text-center">
          Invite your partner
        </Text>

        <Text className="text-lg font-medium text-gray-700 text-center mb-2">
          Your code: {myCode}
        </Text>

        <Button
          label="Share your invite code"
          onPress={handleCopy}
          size="py-3"
          color="bg-pink-400"
          className="w-full rounded-xl"
          textClassName="text-white text-base font-medium"
        />
      </View>

      <Text className="text-base text-gray-600 mb-4">or</Text>

      <View className="w-full bg-white/20 rounded-3xl p-6">
        <Text className="text-xl font-medium text-gray-800 mb-4 text-center">
          Enter partner's code
        </Text>

        <TextInput
          value={partnerCode}
          onChangeText={setPartnerCode}
          placeholder="_ _ _ _ _ _"
          className="text-center text-2xl tracking-[1em] mb-4 py-2"
          maxLength={6}
        />

        <Button
          label="Pair now"
          onPress={onFinish}
          size="py-3"
          color="bg-pink-400"
          className="w-full rounded-xl"
          textClassName="text-white text-base font-medium"
        />
      </View>

      {error && <Text className="text-red-500 text-center mt-4">{error}</Text>}
    </View>
  );
}

const joinRoom = () => {
  const router = useRouter();
  const { userId, roomId } = useLocalSearchParams();
  const roomIdString = Array.isArray(roomId) ? roomId[0] : roomId;
  const [partnerCode, setPartnerCode] = useState('');
  const [error, setError] = useState('');

  const connectRoom = async () => {
    if (partnerCode === roomIdString) {
      setError('Cannot enter your own code');
      return;
    }
    try {
      // Pair with the partner's room
      await pairRoom({
        room_id: partnerCode,
        user_2: Array.isArray(userId) ? userId[0] : userId,
      });

      console.log('Deleting room with ID:', roomIdString);

      // Delete user2's room after pairing
      await deleteRoom({
        room_id: roomIdString,
      });

      // Success feedback and navigation
      console.log('Paired with partner successfully!');
      Alert.alert('Success', 'You have been paired with your partner!');
      router.push('/(home)/home-page');
    } catch (err) {
      console.error('Pairing failed:', err);
      setError('Failed to pair with your partner. Please try again.');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-pink-100">
      <PairingStep
        myCode={roomIdString}
        partnerCode={partnerCode}
        setPartnerCode={setPartnerCode}
        onFinish={connectRoom}
        error={error}
      />
    </View>
  );
};

export default joinRoom;
