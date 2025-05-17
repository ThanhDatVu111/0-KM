import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Button from '@/components/Button';
import { View, Text, Platform, Image, TextInput, Alert } from 'react-native';
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
    <View className="w-full max-w-xs items-center">
      <Text className="text-2xl font-bold text-accent mb-4 text-center">
        Pair with your partner
      </Text>

      <Text className="text-base font-medium text-white mb-2">Your code:</Text>
      <View className="bg-white px-4 py-2 rounded-lg mb-3 w-full items-center">
        <Text className="text-lg font-bold text-black tracking-widest">{myCode}</Text>
      </View>
      <Button
        label="Copy code"
        onPress={handleCopy}
        size="py-2"
        color="bg-gray-300"
        className="w-full mb-4"
        textClassName="text-black"
      />

      <Text className="text-base text-white mt-4 mb-1">Enter partner's code</Text>
      <TextInput
        value={partnerCode}
        onChangeText={setPartnerCode}
        placeholder="XXXXXX"
        className="bg-white px-4 py-2 rounded-lg mb-4 w-full text-center text-lg tracking-widest"
      />

      <View className="flex-row w-full">
        <Button
          label="Pair now"
          onPress={onFinish}
          size="py-3"
          color="bg-accent"
          className="w-1/2 ml-2"
          textClassName="text-white"
        />
      </View>

      {error && <Text className="text-red-500 text-center mb-4">{error}</Text>}
    </View>
  );
}

const joinRoom = () => {
  const router = useRouter();
  const { userId, roomId } = useLocalSearchParams();
  const roomIdString = Array.isArray(roomId) ? roomId[0] : roomId;
  const [partnerCode, setPartnerCode] = useState('');
  const [error, setError] = useState('');

  console.log('roomIdString:', roomIdString);

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
      router.push('/(home)/home-page'); // Replace with your next route
    } catch (err) {
      console.error('Pairing failed:', err);
      setError('Failed to pair with your partner. Please try again.');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-primary px-4">
      <PairingStep
        myCode={roomIdString}
        partnerCode={partnerCode}
        setPartnerCode={setPartnerCode}
        onFinish={connectRoom}
        error={error}
      ></PairingStep>
    </View>
  );
};

export default joinRoom;
