import {
  Text,
  View,
  ActivityIndicator,
  Image,
  Alert,
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
import { createClient } from '@supabase/supabase-js';
import { uploadToCloudinary } from '@/utils/cloudinaryUpload';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
);

const Profile = () => {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId, signOut } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editUsername, setEditUsername] = useState('');
  const [editBirthdate, setEditBirthdate] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [newPhoto, setNewPhoto] = useState<any>(null);

  // Function to fetch partner data
  const fetchPartnerData = async (roomData: any) => {
    if (!roomData || !userId) return;

    const users = [roomData.user_1, roomData.user_2].filter(Boolean);
    const partnerId = users.find((id) => id !== userId);

    if (partnerId) {
      try {
        console.log('🔍 PROFILE: Fetching partner data for:', partnerId);
        const partnerData = await fetchUser(partnerId);
        setPartner(partnerData);
        console.log('✅ PROFILE: Partner data fetched:', partnerData.username);
      } catch (err) {
        console.error('❌ PROFILE: Failed to fetch partner data:', err);
        setPartner(null);
      }
    } else {
      console.log('🔍 PROFILE: No partner found in room');
      setPartner(null);
    }
  };

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

        // Fetch partner data if room has a partner
        await fetchPartnerData(roomData);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch user or room info');
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, userId]);

  // Supabase Realtime subscription to monitor room changes
  useEffect(() => {
    if (!room?.room_id || !userId) return;

    console.log('🔴 PROFILE: Setting up Realtime subscription for room:', room.room_id);

    const channel = supabase
      .channel(`profile-room-${room.room_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room',
          filter: `room_id=eq.${room.room_id}`,
        },
        async (payload: any) => {
          console.log('🟢 PROFILE: Realtime room update received:', payload);

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            const users = [updated.user_1, updated.user_2].filter(Boolean);

            console.log('🟢 PROFILE: Users in room after update:', users);

            // Update room state
            setRoom(updated);

            // Check if partner left (room now has only current user)
            if (users.length === 1 && users[0] === userId) {
              console.log('🟢 PROFILE: Partner left the room');
              setPartner(null);
              Alert.alert('Partner Update', 'Your partner has left the room.');
            }
            // Check if partner joined (room now has 2 users)
            else if (users.length === 2) {
              console.log('🟢 PROFILE: Partner joined or room is full');
              await fetchPartnerData(updated);
            }
          }
        },
      )
      .subscribe((status) => {
        console.log('🔵 PROFILE SUBSCRIPTION STATUS:', status);
      });

    return () => {
      console.log('🔴 PROFILE: Unsubscribing from room:', room.room_id);
      supabase.removeChannel(channel);
    };
  }, [room?.room_id, userId]);

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

      // Upload photo to Cloudinary if a new photo was selected
      if (newPhoto) {
        try {
          console.log('🔄 Uploading profile photo to Cloudinary...');
          const cloudinaryUrl = await uploadToCloudinary(newPhoto.uri, 'image');
          updateData.photo_url = cloudinaryUrl;
          console.log('✅ Profile photo uploaded to:', cloudinaryUrl);
        } catch (uploadErr: any) {
          console.error('❌ Failed to upload profile photo:', uploadErr);
          Alert.alert('Upload Error', 'Failed to upload profile photo. Please try again.');
          setSaving(false);
          return;
        }
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
                // Clear partner state when leaving
                setPartner(null);
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
                  // Clear partner state when deleting room
                  setPartner(null);
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

                    {/* Partner Profile Section */}
                    {partner && (
                      <View
                        style={{
                          width: '100%',
                          backgroundColor: '#F3EEFF',
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: '#6536DD',
                          padding: 16,
                          marginTop: 16,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: '#6536DD',
                            marginBottom: 12,
                            textAlign: 'center',
                          }}
                        >
                          Your Partner
                        </Text>
                        <Image
                          source={{ uri: partner.photo_url }}
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            marginBottom: 8,
                            borderWidth: 2,
                            borderColor: '#6536DD',
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: '#6536DD',
                            marginBottom: 4,
                          }}
                        >
                          {partner.username}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: '#666',
                            marginBottom: 4,
                          }}
                        >
                          {partner.birthdate}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: '#888',
                            textAlign: 'center',
                          }}
                        >
                          Paired since {new Date(partner.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    {!partner && room?.room_id && (
                      <View
                        style={{
                          width: '100%',
                          backgroundColor: '#FFF3E0',
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: '#FF9800',
                          padding: 16,
                          marginTop: 16,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: '#FF9800',
                            textAlign: 'center',
                            fontWeight: 'bold',
                          }}
                        >
                          Waiting for Partner
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: '#666',
                            textAlign: 'center',
                            marginTop: 4,
                          }}
                        >
                          Share your room code with someone to get paired!
                        </Text>
                      </View>
                    )}
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
                            backgroundColor: '#4CAF50',
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: '#2E7D32',
                            paddingVertical: 8,
                            paddingHorizontal: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#2E7D32',
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
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 12,
                            marginTop: 16,
                            justifyContent: 'center',
                            width: '100%',
                          }}
                        >
                          <Pressable
                            onPress={leaveRoom}
                            style={{
                              backgroundColor: '#F24187',
                              borderRadius: 8,
                              borderWidth: 2,
                              borderColor: '#6536DD',
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: '#6536DD',
                              shadowOffset: { width: 2, height: 2 },
                              shadowOpacity: 1,
                              shadowRadius: 0,
                              elevation: 8,
                              flex: 1,
                            }}
                          >
                            <Text
                              style={{
                                color: '#fff',
                                fontFamily: 'PressStart2P',
                                fontSize: 10,
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                              }}
                            >
                              Leave Room
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={handleLogout}
                            style={{
                              backgroundColor: '#6536DD',
                              borderRadius: 8,
                              borderWidth: 2,
                              borderColor: '#F24187',
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: '#F24187',
                              shadowOffset: { width: 2, height: 2 },
                              shadowOpacity: 1,
                              shadowRadius: 0,
                              elevation: 8,
                              flex: 1,
                            }}
                          >
                            <Text
                              style={{
                                color: '#fff',
                                fontFamily: 'PressStart2P',
                                fontSize: 10,
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                              }}
                            >
                              Log Out
                            </Text>
                          </Pressable>
                        </View>
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
