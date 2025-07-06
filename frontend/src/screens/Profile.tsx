import {
  Text,
  View,
  ActivityIndicator,
  Image,
  Alert,
  Button,
  Pressable,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { fetchUser, updateUserProfileUnified } from '@/apis/user';
import { fetchRoom, updateRoom, deleteRoom } from '@/apis/room';
import FormInput from '@/components/FormInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import images from '@/constants/images';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

const Profile = () => {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId, signOut } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editUsername, setEditUsername] = useState('');
  const [editBirthdate, setEditBirthdate] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [newPhoto, setNewPhoto] = useState<any>(null);
  let isLastUser = false;

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    (async () => {
      setLoading(true);
      try {
        const userData = await fetchUser(userId!);
        setUser(userData);
        setEditUsername(userData?.username || '');
        setEditBirthdate(userData?.birthdate || '');
        setPhotoUrl(userData?.photo_url);
        // Fetch room info
        const roomData = await fetchRoom({ user_id: userId! });
        setRoom(roomData);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch user or room info');
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, userId]);

  const isValidBirthdate = (date: string) => {
    // Simple regex for YYYY-MM-DD
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {};
      if (editUsername !== user?.username) updateData.username = editUsername;
      if (editBirthdate !== user?.birthdate) {
        if (!isValidBirthdate(editBirthdate)) {
          Alert.alert('Invalid birthdate', 'Please enter birthdate in YYYY-MM-DD format.');
          setSaving(false);
          return;
        }
        updateData.birthdate = editBirthdate;
      }
      if (newPhoto) {
        updateData.photo_url = newPhoto.uri;
      }
      if (Object.keys(updateData).length === 0) {
        Alert.alert('No changes', 'You have not made any changes to your profile.');
        setSaving(false);
        return;
      }
      const result = await updateUserProfileUnified(userId!, updateData);
      setUser({ ...user, ...result });
      if (result.photo_url) setPhotoUrl(result.photo_url);
      Alert.alert('Success', 'Profile updated!');
      setEditing(false);
      setNewPhoto(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditUsername(user?.username || '');
    setEditBirthdate(user?.birthdate || '');
    setPhotoUrl(user?.photo_url);
    setEditing(false);
    setNewPhoto(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setNewPhoto({
        uri: asset.uri,
        fileName: asset.fileName || asset.uri.split('/').pop() || `profile_${userId}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      setPhotoUrl(asset.uri);
    }
  };

  const leaveRoom = async () => {
    try {
      // Always fetch the latest room data before deciding
      const latestRoom = await fetchRoom({ user_id: user.user_id });
      const usersInRoom = [latestRoom.user_1, latestRoom.user_2].filter(Boolean);
      const isLastUser = usersInRoom.length === 1 && usersInRoom[0] === user.user_id;

      if (!isLastUser) {
        Alert.alert('Leave Room', 'Are you sure you want to leave the room?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              try {
                await updateRoom(latestRoom.room_id, user.user_id);
                router.replace('/(onboard)/join-room');
              } catch (err) {
                Alert.alert('Error', 'Failed to leave the room.');
              }
            },
          },
        ]);
        return;
      } else {
        Alert.alert(
          'Notice',
          'You are the last user. The room will be deleted when you leave. Do you want to proceed?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteRoom({ room_id: latestRoom.room_id });
                  router.replace('/(onboard)/join-room');
                } catch (err) {
                  Alert.alert('Error', 'Failed to leave and delete the room.');
                }
              },
            },
          ],
        );
        return;
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to check room status.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/signin'); // Adjust route as needed
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  // Format created_at date
  let createdAt = user?.created_at;
  if (createdAt) {
    try {
      createdAt = new Date(createdAt).toLocaleDateString();
    } catch {}
  }

  return (
    <ImageBackground
      source={images.profileBg}
      style={{ flex: 1, width: '100%', height: '105%' }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: '92%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            borderWidth: 2,
            borderColor: 'black',
            borderRadius: 12,
            backgroundColor: 'transparent',
          }}
        >
          {/* Purple Header Section */}
          <View
            style={{
              backgroundColor: '#6536DD',
              borderBottomWidth: 4,
              borderColor: 'black',
              paddingHorizontal: 16,
              paddingVertical: 16,
              alignItems: 'center',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              position: 'relative',
            }}
          >
            {/* Edit Icon Button in the absolute top right corner */}
            {!editing && (
              <Pressable
                onPress={() => setEditing(true)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 12,
                  backgroundColor: '#F24187',
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: '#6536DD',
                  padding: 6,
                  shadowColor: '#6536DD',
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  elevation: 8,
                  zIndex: 10,
                }}
              >
                <MaterialIcons name="edit" size={24} color="#fff" />
              </Pressable>
            )}
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 40 }}>
              <View style={{ position: 'absolute' }}>
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
                      fontSize: 25,
                      color: 'white',
                      left: dx,
                      top: dy,
                    }}
                  >
                    Profile
                  </Text>
                ))}
                <Text
                  style={{
                    fontFamily: 'PressStart2P',
                    fontSize: 25,
                    color: '#F24187',
                  }}
                >
                  Profile
                </Text>
              </View>
            </View>
          </View>
          {/* White Form Section */}
          <View
            style={{
              backgroundColor: 'white',
              paddingHorizontal: 32,
              paddingVertical: 32,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <Pressable onPress={editing ? pickImage : undefined}>
                  <Image
                    source={{ uri: photoUrl }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      marginBottom: 16,
                      alignSelf: 'center',
                    }}
                  />
                  {editing && (
                    <Text style={{ color: '#6536DD', textAlign: 'center' }}>Change Photo</Text>
                  )}
                </Pressable>
                {editing ? (
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      marginTop: 15,
                    }}
                  >
                    <FormInput
                      value={editUsername}
                      onChangeText={setEditUsername}
                      borderColor="#6536DD"
                      style={{ marginBottom: 8, width: 240, alignSelf: 'center', marginLeft: 16 }}
                    />
                    <FormInput
                      value={editBirthdate}
                      onChangeText={setEditBirthdate}
                      borderColor="#6536DD"
                      style={{ marginBottom: 8, width: 240, alignSelf: 'center', marginLeft: 16 }}
                      placeholder="YYYY-MM-DD"
                    />
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 12,
                        marginBottom: 12,
                        justifyContent: 'center',
                      }}
                    >
                      <Pressable
                        onPress={handleSave}
                        disabled={saving}
                        style={{
                          backgroundColor: '#F24187',
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: '#6536DD',
                          paddingVertical: 8,
                          paddingHorizontal: 24,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#6536DD',
                          shadowOffset: { width: 2, height: 2 },
                          shadowOpacity: 1,
                          shadowRadius: 0,
                          elevation: 8,
                          marginRight: 8,
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        <Text
                          style={{
                            color: '#fff',
                            fontFamily: 'PressStart2P',
                            fontSize: 12,
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                          }}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCancel}
                        disabled={saving}
                        style={{
                          backgroundColor: '#6536DD',
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: '#F24187',
                          paddingVertical: 8,
                          paddingHorizontal: 24,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#F24187',
                          shadowOffset: { width: 2, height: 2 },
                          shadowOpacity: 1,
                          shadowRadius: 0,
                          elevation: 8,
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        <Text
                          style={{
                            color: '#fff',
                            fontFamily: 'PressStart2P',
                            fontSize: 12,
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                          }}
                        >
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                      {user?.username || 'No username'}
                    </Text>
                    <Text style={{ fontSize: 16, marginBottom: 8 }}>{user?.birthdate}</Text>
                    <Text style={{ fontSize: 16, marginBottom: 8 }}>{user?.email}</Text>
                    <Text style={{ fontSize: 14, color: 'gray', marginTop: 8 }}>
                      Account created: {createdAt}
                    </Text>
                    {/* Button group for room actions */}
                    <View style={{ width: '100%', alignItems: 'center', marginTop: 16 }}>
                      {room?.room_id && (
                        <Pressable
                          onPress={async () => {
                            await Clipboard.setStringAsync(room.room_id);
                            Alert.alert(
                              'Copied!',
                              `Room code ${room.room_id} copied to clipboard.`,
                            );
                          }}
                          style={{
                            backgroundColor: '#6536DD',
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: '#F24187',
                            paddingVertical: 8,
                            paddingHorizontal: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#F24187',
                            shadowOffset: { width: 2, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                            elevation: 8,
                            marginTop: 0,
                          }}
                        >
                          <Text
                            style={{
                              color: '#fff',
                              fontFamily: 'PressStart2P',
                              fontSize: 12,
                              letterSpacing: 2,
                              textTransform: 'uppercase',
                            }}
                          >
                            Copy Room Code
                          </Text>
                        </Pressable>
                      )}
                      {!editing && (
                        <Pressable
                          onPress={leaveRoom}
                          style={{
                            backgroundColor: '#F24187',
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: '#6536DD',
                            paddingVertical: 8,
                            paddingHorizontal: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#6536DD',
                            shadowOffset: { width: 2, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                            elevation: 8,
                            marginTop: 16,
                          }}
                        >
                          <Text
                            style={{
                              color: '#fff',
                              fontFamily: 'PressStart2P',
                              fontSize: 12,
                              letterSpacing: 2,
                              textTransform: 'uppercase',
                            }}
                          >
                            Leave Room
                          </Text>
                        </Pressable>
                      )}
                      {!editing && (
                        <Pressable
                          onPress={handleLogout}
                          style={{
                            backgroundColor: '#6536DD',
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: '#F24187',
                            paddingVertical: 8,
                            paddingHorizontal: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#F24187',
                            shadowOffset: { width: 2, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                            elevation: 8,
                            marginTop: 16,
                          }}
                        >
                          <Text
                            style={{
                              color: '#fff',
                              fontFamily: 'PressStart2P',
                              fontSize: 12,
                              letterSpacing: 2,
                              textTransform: 'uppercase',
                            }}
                          >
                            Log Out
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Profile;
