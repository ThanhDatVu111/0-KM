import React from 'react';
import { Tabs } from 'expo-router';
import { Image, ImageBackground, ImageSourcePropType, Platform, View } from 'react-native';
import icons from '@/constants/icons';
import images from '@/constants/images';

function TabIcon({
  focused,
  icon,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
}) {
  return (
    <Image
      source={icon}
      style={{
        width: 36, // ⬆️ Bigger
        height: 36,
        marginTop: 60, // ⬇️ Pushes it downward within tab
        tintColor: focused ? '#ED4C90' : '#000000',
      }}
      resizeMode="contain"
    />
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
          height: 100,
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
        tabBarBackground: () => (
          <ImageBackground
            source={images.navBarBackground} // 👈 your retro pink background image
            resizeMode="stretch"
            style={{ width: '100%', height: '100%' }}
          />
        ),
      }}
    >
      {/*The focused prop is passed in by the tab navigator to let your tabBarIcon know 
      if that tab is currently active, so you can style the icon differently when it’s selected.*/}
      <Tabs.Screen
        name="home"
        options={{
          title: 'home',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.home_page} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'library',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.books} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'calendar',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.calendar} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'chat',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.speech_bubble} />,
        }}
      />
    </Tabs>
  );
}
