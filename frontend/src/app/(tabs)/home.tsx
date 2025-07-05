import { View, Text, Pressable, Image, Modal } from 'react-native';
import React, { useState } from 'react';
import { SignOutButton } from '@/components/SignOutButton';
import icons from '@/constants/icons';
import Profile from '@/screens/Profile';

const Home = () => {
  const [showProfile, setShowProfile] = useState(false);
  return (
    <View className="tab-screen" style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          width: '100%',
          padding: 16,
        }}
      >
        <Pressable onPress={() => setShowProfile(true)}>
          <Image source={icons.person} style={{ width: 32, height: 32 }} />
        </Pressable>
      </View>
      <Text>this is home</Text>
      <SignOutButton />
      <Modal
        visible={showProfile}
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
      >
        <Profile />
        <Pressable
          onPress={() => setShowProfile(false)}
          style={{ position: 'absolute', top: 40, right: 20 }}
        >
          <Text style={{ fontSize: 18, color: 'blue' }}>Close</Text>
        </Pressable>
      </Modal>
    </View>
  );
};

export default Home;
