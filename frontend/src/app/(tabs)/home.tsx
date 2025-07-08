import { SignOutButton } from '@/components/SignOutButton';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, Pressable, Modal } from 'react-native';
import React, { useState } from 'react';
import Profile from '@/screens/Profile';
import { FontAwesome } from '@expo/vector-icons';

const Home = () => {
  const { userId } = useLocalSearchParams();
  const [showProfile, setShowProfile] = useState(false);
  return (
    <View className="tab-screen" style={{ flex: 1 }}>
      <Text>this is home</Text>

      <Modal
        visible={showProfile}
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={{ flex: 1 }}>
          <Pressable
            onPress={() => setShowProfile(false)}
            style={{
              position: 'absolute',
              top: 80,
              right: 25,
              width: 48,
              height: 48,
              backgroundColor: '#F24187',
              borderRadius: 8,
              borderWidth: 2,
              borderColor: '#6536DD',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#6536DD',
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
              zIndex: 10,
            }}
          >
            <Text style={{ color: '#fff', fontFamily: 'PressStart2P', fontSize: 20 }}>X</Text>
          </Pressable>
          <Profile />
        </View>
      </Modal>
      {/* Profile Button in the absolute top right corner */}
      <Pressable
        onPress={() => setShowProfile(true)}
        style={{
          position: 'absolute',
          top: 80,
          right: 24,
          backgroundColor: '#F24187',
          borderRadius: 12,
          borderWidth: 2,
          borderColor: '#6536DD',
          padding: 8,
          shadowColor: '#6536DD',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 8,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <FontAwesome name="user" size={32} color="#fff" />
      </Pressable>
    </View>
  );
};

export default Home;
