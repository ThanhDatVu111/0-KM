import React, { useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import {
  TouchableOpacity,
  Image,
  Modal,
  Text,
  View,
  Pressable,
} from 'react-native';

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      Linking.openURL(Linking.createURL('/'));
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (!user) return null; //If the user is not signed in (i.e., user is undefined), then don't render anything from this component.

  return (
    <>
      {/* Avatar Icon */}
      <TouchableOpacity onPress={() => setShowMenu(true)}>
        <Image
          source={{ uri: user.imageUrl }}
          className="w-10 h-10 rounded-full border-2 border-white"
        />
      </TouchableOpacity>

      {/* Modal Dropdown */}
      <Modal
        transparent
        visible={showMenu}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center"
          onPressOut={() => setShowMenu(false)}
        >
          <View className="bg-white p-4 rounded-lg shadow-lg w-[250px] items-center">
            <Text className="text-lg font-semibold mb-2">User</Text>

            <Text className="text-sm text-gray-500 mb-4">
              {user.primaryEmailAddress?.emailAddress}
            </Text>

            <TouchableOpacity
              onPress={() => {
                handleSignOut();
                setShowMenu(false);
              }}
              className="py-2 px-4 bg-red-500 rounded w-full"
            >
              <Text className="text-white text-center">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};
