import React from 'react';
import { Tabs } from 'expo-router';
import icons from '@/constants/icons';
import images from '@/constants/images';
import { ImageBackground, Image, Text, View, ImageSourcePropType, Platform } from 'react-native';

function TabIcon({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}) {
  if (focused) {
    return (
      <ImageBackground
        source={images.highlight}
        className="flex flex-row w-full flex-1 min-w-[112px] min-h-14 mt-4 justify-center items-center rounded-full overflow-hidden"
      >
        <Image source={icon} tintColor="#F5829B" className="size-5" />
        <Text className="text-secondary text-base font-semibold ml-2 text-accent">{title}</Text>
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
          backgroundColor: '#F5CDDE',
          borderRadius: 50,
          marginHorizontal: 10,
          marginBottom: 36,
          height: 54,
          position: 'absolute',
          overflow: 'hidden',
          borderWidth: 1,
          // === Drop shadow for iOS ===
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            },
            android: {
              // === “elevation” is the Android shortcut for drop shadows ===
              elevation: 5,
            },
          }),
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
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.speech_bubble} title="Chat" />
          ),
        }}
      />
    </Tabs>
  );
}
