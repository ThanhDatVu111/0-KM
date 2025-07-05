import { Text, View, ActivityIndicator, Image, Alert, Button, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { fetchUser, updateUserProfileUnified } from '@/apis/user';
import FormInput from '@/components/FormInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const Profile = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editUsername, setEditUsername] = useState('');
  const [editBirthdate, setEditBirthdate] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [newPhoto, setNewPhoto] = useState<any>(null);

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
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch user info');
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
    <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Pressable onPress={editing ? pickImage : undefined} disabled={!editing || uploading}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 16 }}
          />
        ) : (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#eee',
              marginBottom: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text>+</Text>
          </View>
        )}
        {editing && <Text style={{ color: '#6536DD', textAlign: 'center' }}>Change Photo</Text>}
      </Pressable>
      {editing ? (
        <>
          <FormInput
            label="Username"
            value={editUsername}
            onChangeText={setEditUsername}
            borderColor="#6536DD"
            style={{ marginBottom: 8, width: 240 }}
          />
          <FormInput
            label="Birthdate"
            value={editBirthdate}
            onChangeText={setEditBirthdate}
            borderColor="#6536DD"
            style={{ marginBottom: 8, width: 240 }}
            placeholder="YYYY-MM-DD"
          />
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <Button
              title={saving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              disabled={saving || uploading}
            />
            <Button title="Cancel" onPress={handleCancel} disabled={saving || uploading} />
          </View>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
            {user?.username || 'No username'}
          </Text>
          <Text style={{ fontSize: 16 }}>{user?.birthdate}</Text>
          <Button title="Edit" onPress={() => setEditing(true)} />
        </>
      )}
      <Text style={{ fontSize: 16, marginBottom: 8 }}>{user?.email}</Text>
      <Text style={{ fontSize: 14, color: 'gray', marginTop: 8 }}>
        Account created: {createdAt}
      </Text>
    </SafeAreaView>
  );
};

export default Profile;
