import React, { useState } from 'react';
import { View, Text, Pressable, Image, TouchableOpacity} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import images from '@/constants/images';

interface EntryCardProps {
  title: string;
  body: string;
  createdAt: string;
  media: string[];
  location?: { address: string } | null;
  onDelete: () => void;
  onEdit: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({
  title,
  body,
  createdAt,
  media,
  location,
  onDelete,
  onEdit,
}) => {
  // Format the date to a more readable format
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible((v) => !v);

  const extraCount = media.length > 5 ? media.length - 5 : 0;

  // Grab up to 5 URIs
  const uri0 = media[0];
  const uri1 = media[1];
  const uri2 = media[2];
  const uri3 = media[3];
  const uri4 = media[4];

  const renderCollage = () => {
    switch (media.length) {
      // ─── CASE 0: no images ───
      case 0:
        return null;

      // ─── CASE 1: one image fills entire width ───
      case 1:
        return (
          <View className="h-36">
            <Image
              source={{ uri: uri0! }}
              className="w-full h-full rounded-lg border-2 border-transparent"
              resizeMode="cover"
            />
          </View>
        );

      // ─── CASE 2: two images side-by-side (50/50) ───
      case 2:
        return (
          <View className="flex-row h-36 space-x-1">
            <Image
              source={{ uri: uri0! }}
              className="w-1/2 h-full rounded-lg border-2 border-transparent"
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri1! }}
              className="w-1/2 h-full rounded-lg border-2 border-transparent"
              resizeMode="cover"
            />
          </View>
        );

      // ─── CASE 3: one large left + two stacked on right ───
      case 3:
        return (
          <View className="flex-row h-36 space-x-1">
            {/* Left: 50% width */}
            <Image
              source={{ uri: uri0! }}
              className="w-1/2 h-full rounded-lg border-2 border-transparent"
              resizeMode="cover"
            />
            {/* Right: two stacked (each h-1/2) */}
            <View className="w-1/2 h-full flex-col space-y-1">
              <Image
                source={{ uri: uri1! }}
                className="w-full h-1/2 rounded-lg border-2 border-transparent"
                resizeMode="cover"
              />
              <Image
                source={{ uri: uri2! }}
                className="w-full h-1/2 rounded-lg border-2 border-transparent"
                resizeMode="cover"
              />
            </View>
          </View>
        );

      // ─── CASE 4: 2×2 grid, equal squares ───
      case 4:
        return (
          <View className="flex-row flex-wrap h-36">
            <Image
              source={{ uri: uri0! }}
              className="w-1/2 h-1/2 rounded-lg border-2 border-transparent"
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri1! }}
              className="w-1/2 h-1/2 rounded-lg border-2 border-transparent"
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri2! }}
              className="w-1/2 h-1/2 rounded-lg border-2 border-transparent"
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri3! }}
              className="w-1/2 h-1/2 rounded-lg border-2 border-transparent"
              resizeMode="cover"
            />
          </View>
        );

      // ─── CASE 5+: one large left + 2×2 mini + “+N” overlay ───
      default:
        return (
          <View className="flex-row h-36 space-x-1">
            {/* Left: 50% width */}
            <Image
              source={{ uri: uri0! }}
              className="w-1/2 h-full rounded-lg border-2 border-transparent"
              resizeMode="cover"
            />
            {/* Right: a 2×2 grid */}
            <View className="w-1/2 h-full flex-row flex-wrap relative">
              {/* Top-left mini (fills quarter of total) */}
              <Image
                source={{ uri: uri1! }}
                className="w-1/2 h-1/2 rounded-lg border-2 border-transparent"
                resizeMode="cover"
              />
              {/* Top-right mini */}
              <Image
                source={{ uri: uri2! }}
                className="w-1/2 h-1/2 rounded-lg border-2 border-transparent"
                resizeMode="cover"
              />
              {/* Bottom-left mini */}
              <Image
                source={{ uri: uri3! }}
                className="w-1/2 h-1/2 rounded-lg border-2 border-transparent"
                resizeMode="cover"
              />
              {/* Bottom-right mini with +N overlay */}
              <View className="relative w-1/2 h-1/2 rounded-lg overflow-hidden">
                <Image
                  source={{ uri: uri4! }}
                  className="w-full h-full rounded-lg border-2 border-white"
                  resizeMode="cover"
                />
                {extraCount > 0 && (
                  <>
                    {/* 1) The blur layer */}
                    <BlurView
                      intensity={10}
                      tint="default"
                      className="absolute inset-0 rounded-lg"
                    />

                    {/* 2) The “+N” text on top */}
                    <View className="absolute inset-0 flex items-center justify-center rounded-lg">
                      <Text className="text-white font-semibold text-lg">+{extraCount}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <View
      style={{
        width: 365,
        height: 320,
        alignSelf: 'center',
        marginBottom: 30,
        position: 'relative',
        alignItems: 'center',
        top: 0,
      }}
    >
      {/* Layer 1 */}
      <View
        style={{
          width: 345,
          height: 320,
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          backgroundColor: 'transparent',
          position: 'absolute', // if stacking needed
          zIndex: 1,
        }}
      >
        <Image
          source={images.layer1}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
      </View>

      {/* Layer 2 */}
      <View
        style={{
          width: 365,
          height: 310,
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          backgroundColor: 'transparent',
          position: 'absolute',
          zIndex: 1,
        }}
      >
        <Image
          source={images.layer2}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
        {/* Menu Button in bottom right */}
        <View
          style={{
            position: 'absolute',
            bottom: 30,
            right: 15,
            zIndex: 20,
          }}
        >
          <TouchableOpacity
            onPress={toggleMenu}
            hitSlop={8}
            style={{
              width: 28,
              height: 28,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#000" />
          </TouchableOpacity>

          {menuVisible && (
            <View
              style={{
                position: 'absolute',
                top: 20, // Show menu below the button
                right: 0,
                backgroundColor: '#FFF',
                borderWidth: 2,
                borderColor: '#000',
                borderRadius: 10,
                minWidth: 70,
                zIndex: 21,
                shadowColor: '#000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <Pressable
                onPress={() => {
                  onEdit();
                  setMenuVisible(false);
                }}
                style={{ padding: 10 }}
              >
                <Text style={{ fontFamily: 'PixelifySans', fontSize: 12 }}>Edit</Text>
              </Pressable>
              <View style={{ height: 1, backgroundColor: '#000' }} />
              <Pressable
                onPress={() => {
                  onDelete();
                  setMenuVisible(false);
                }}
                style={{ padding: 10 }}
              >
                <Text style={{ fontFamily: 'PixelifySans', fontSize: 12, color: '#d63031' }}>
                  Delete
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        {/* CreatedAt & Location in bottom left */}
        <View
          style={{
            position: 'absolute',
            bottom: 40,
            left: 20,
            zIndex: 20,
            maxWidth: 150,
          }}
        >
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 11,
              color: '#636e72',
            }}
            numberOfLines={1}
          >
            {formattedDate}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            zIndex: 20,
            maxWidth: 150,
          }}
        >
          {location?.address && (
            <Text
              style={{
                fontFamily: 'PixelifySans',
                fontSize: 11,
                color: '#636e72',
              }}
              numberOfLines={1}
            >
              {location.address}
            </Text>
          )}
        </View>
      </View>

      {/* Layer 3 */}
      <View
        style={{
          width: 330,
          height: 230,
          top: 19,
          position: 'absolute', // if stacking needed
          zIndex: 1,
        }}
      >
        <Image
          source={images.layer3}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
      </View>

      {/* Layer 4 */}
      <View
        style={{
          width: 310,
          height: 215,
          top: 26,
          position: 'absolute', // if stacking needed
          zIndex: 1,
        }}
      >
        <Image
          source={images.layer4}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
        <View
          style={{
            position: 'absolute',
            top: 10, // ⬅️ move down to match white area
            left: 10, // ⬅️ add padding from left if needed
            right: 10, // ⬅️ prevent overflow on the right
            zIndex: 5,
          }}
        >
          {renderCollage()}
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontWeight: 'bold',
              fontSize: 18,
              color: '#222',
              marginTop: 5,
              textAlign: 'left',
              alignSelf: 'flex-start',
              // marginLeft: 8, // remove this
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 14,
              marginTop: 3,
              color: '#444',
              textAlign: 'left',
              alignSelf: 'flex-start',
              // marginLeft: 8, // remove this
            }}
            numberOfLines={2}
          >
            {body}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default EntryCard;
