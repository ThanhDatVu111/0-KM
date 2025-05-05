import React from 'react';
import { Tabs } from 'expo-router';
import icons from '@/constants/icons';
import images from '@/constants/images';
import { ImageBackground, Image, Text, View } from 'react-native';

function TabIcon({ focused, icon, title }: any) {
  if (focused) {
    return (
      <ImageBackground
        source={images.highlight}
        className="flex flex-row w-full flex-1 min-w-[112px] min-h-14 mt-4 justify-center items-center rounded-full overflow-hidden"
      >
        <Image source={icon} tintColor="#151312" className="size-5" />
        <Text className="text-secondary text-base font-semibold ml-2">{title}</Text>
      </ImageBackground>
    );
  }

  return (
    <View className="size-full justify-center items-center mt-4 rounded-full">
      <Image source={icon} tintColor="#151312" className="size-5" />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: '#F5829B',
          borderRadius: 50,
          marginHorizontal: 10,
          marginBottom: 36,
          height: 52,
          position: 'absolute',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '',
        },
      }}
    >
      {/*The focused prop is passed in by the tab navigator to let your tabBarIcon know 
      if that tab is currently active, so you can style the icon differently when it’s selected.*/}
      <Tabs.Screen
        name="home"
        options={{
          title: 'home',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home_page} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'library',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.books} title="Library" />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'calendar',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.calendar} title="Calendar" />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'chat',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.speech_bubble} title="Chat" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}
