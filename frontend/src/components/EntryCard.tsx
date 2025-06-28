import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { BlurView } from 'expo-blur';
import images from '@/constants/images';
import icons from '@/constants/icons';

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

  const [expanded, setExpanded] = useState(false);

  // Carousel state for expanded mode
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Enable layout animation on Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const extraCount = media.length > 5 ? media.length - 5 : 0;

  // Grab up to 5 URIs
  const uri0 = media[0];
  const uri1 = media[1];
  const uri2 = media[2];
  const uri3 = media[3];
  const uri4 = media[4];

  // Carousel image height (easy to update in one place)
  const CAROUSEL_HEIGHT = 256; // 64 * 4 = 256, matches h-64

  // Carousel width state for paging
  const [carouselWidth, setCarouselWidth] = useState(0);

  // Single-image view for expanded mode
  const renderCarousel = () => {
    if (!media.length) {
      return (
        <View
          className="w-full bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center"
          style={{ height: CAROUSEL_HEIGHT }}
        >
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 13,
              color: '#888',
              textAlign: 'center',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              textShadowColor: '#fff',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 0,
            }}
          >
            Please add a picture
          </Text>
        </View>
      );
    }
    return (
      <View
        style={{ width: '100%', height: CAROUSEL_HEIGHT, position: 'relative' }}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          if (width !== carouselWidth) setCarouselWidth(width);
        }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const width = carouselWidth;
            if (width > 0) {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCarouselIndex(index);
            }
          }}
          contentContainerStyle={{ width: carouselWidth * media.length }}
          style={{ width: '100%', height: CAROUSEL_HEIGHT }}
          scrollEventThrottle={16}
        >
          {media.map((uri, idx) => (
            <View key={idx} style={{ width: carouselWidth, height: CAROUSEL_HEIGHT }}>
              <Image
                source={{ uri }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: 'transparent',
                }}
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>
        {/* Indicator */}
        {media.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: 6,
              alignSelf: 'center',
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {media.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  marginHorizontal: 2,
                  backgroundColor: idx === carouselIndex ? '#6536DD' : '#ccc',
                  borderWidth: 1,
                  borderColor: '#000',
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // Collage image height (easy to update in one place)
  const COLLAGE_HEIGHT = 140; // 36 * 4 = 144, close to 140 for pixel grid

  const renderCollage = () => {
    // Common style for all collage images/containers
    const collageContainerStyle = { height: COLLAGE_HEIGHT };
    const imageStyle = 'rounded-lg border-2 border-transparent';
    switch (media.length) {
      // ─── CASE 0: no images ───
      case 0:
        return (
          <View
            className="w-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center"
            style={collageContainerStyle}
          >
            <Text
              style={{
                fontFamily: 'PixelifySans',
                fontSize: 13,
                color: '#888',
                textAlign: 'center',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                textShadowColor: '#fff',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 0,
              }}
            >
              Please add a picture
            </Text>
          </View>
        );

      // ─── CASE 1: one image fills entire width ───
      case 1:
        return (
          <View style={collageContainerStyle}>
            <Image
              source={{ uri: uri0! }}
              className={`w-full h-full ${imageStyle}`}
              resizeMode="cover"
            />
          </View>
        );

      // ─── CASE 2: two images side-by-side (50/50) ───
      case 2:
        return (
          <View className="flex-row space-x-1" style={collageContainerStyle}>
            <Image
              source={{ uri: uri0! }}
              className={`w-1/2 h-full ${imageStyle}`}
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri1! }}
              className={`w-1/2 h-full ${imageStyle}`}
              resizeMode="cover"
            />
          </View>
        );

      // ─── CASE 3: one large left + two stacked on right ───
      case 3:
        return (
          <View className="flex-row space-x-1" style={collageContainerStyle}>
            {/* Left: 50% width */}
            <Image
              source={{ uri: uri0! }}
              className={`w-1/2 h-full ${imageStyle}`}
              resizeMode="cover"
            />
            {/* Right: two stacked (each h-1/2) */}
            <View className="w-1/2 flex-col space-y-1 h-full">
              <Image
                source={{ uri: uri1! }}
                className={`w-full h-1/2 ${imageStyle}`}
                resizeMode="cover"
              />
              <Image
                source={{ uri: uri2! }}
                className={`w-full h-1/2 ${imageStyle}`}
                resizeMode="cover"
              />
            </View>
          </View>
        );

      // ─── CASE 4: 2×2 grid, equal squares ───
      case 4:
        return (
          <View className="flex-row flex-wrap" style={collageContainerStyle}>
            <Image
              source={{ uri: uri0! }}
              className={`w-1/2 h-1/2 ${imageStyle}`}
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri1! }}
              className={`w-1/2 h-1/2 ${imageStyle}`}
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri2! }}
              className={`w-1/2 h-1/2 ${imageStyle}`}
              resizeMode="cover"
            />
            <Image
              source={{ uri: uri3! }}
              className={`w-1/2 h-1/2 ${imageStyle}`}
              resizeMode="cover"
            />
          </View>
        );

      // ─── CASE 5+: one large left + 2×2 mini + “+N” overlay ───
      default:
        return (
          <View className="flex-row space-x-1" style={collageContainerStyle}>
            {/* Left: 50% width */}
            <Image
              source={{ uri: uri0! }}
              className={`w-1/2 h-full ${imageStyle}`}
              resizeMode="cover"
            />
            {/* Right: a 2×2 grid */}
            <View className="w-1/2 flex-row flex-wrap relative h-full">
              {/* Top-left mini (fills quarter of total) */}
              <Image
                source={{ uri: uri1! }}
                className={`w-1/2 h-1/2 ${imageStyle}`}
                resizeMode="cover"
              />
              {/* Top-right mini */}
              <Image
                source={{ uri: uri2! }}
                className={`w-1/2 h-1/2 ${imageStyle}`}
                resizeMode="cover"
              />
              {/* Bottom-left mini */}
              <Image
                source={{ uri: uri3! }}
                className={`w-1/2 h-1/2 ${imageStyle}`}
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

  // Calculate expanded size
  const isExpanded = expanded;
  const cardWidth = 365;
  const cardHeight = isExpanded ? 480 : 330;
  const layer1Width = 345;
  const layer1Height = isExpanded ? 480 : 330;
  const layer2Width = 365;
  const layer2Height = isExpanded ? 470 : 320;
  const layer3Width = 330;
  const layer3Height = isExpanded ? 395 : 255;
  const layer4Width = 310;
  const layer4Height = isExpanded ? 370 : 230;
  const layer4Top = 31;

  // Smooth expand/collapse handler
  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View
      style={{
        width: cardWidth,
        height: cardHeight,
        alignSelf: 'center',
        marginBottom: 15,
        position: 'relative',
        alignItems: 'center',
        top: 0,
        transitionProperty: 'width, height',
        transitionDuration: '300ms',
      }}
    >
      {/* Layer 1 */}
      <View
        style={{
          width: layer1Width,
          height: layer1Height,
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          backgroundColor: 'transparent',
          position: 'absolute',
          zIndex: 1,
          transitionProperty: 'width, height',
          transitionDuration: '300ms',
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
          width: layer2Width,
          height: layer2Height,
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          backgroundColor: 'transparent',
          position: 'absolute',
          zIndex: 1,
          transitionProperty: 'width, height',
          transitionDuration: '300ms',
        }}
      >
        <Image
          source={images.layer2}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
        {/* Action Icons in bottom right */}
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            right: 15,
            zIndex: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            width: 110, // enough for 3 icons with spacing
          }}
        >
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpanded((prev) => !prev);
            }}
            accessibilityLabel={expanded ? 'Collapse' : 'Expand'}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <Image
              source={expanded ? icons.zoomout : icons.zoomin}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onEdit}
            accessibilityLabel="Edit"
            style={{ flex: 1, alignItems: 'center' }}
          >
            <Image source={icons.edit} style={{ width: 21, height: 21 }} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            accessibilityLabel="Delete"
            style={{ flex: 1, alignItems: 'center' }}
          >
            <Image
              source={icons.deleteIcon}
              style={{ width: 21, height: 21 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        {/* CreatedAt & Location in bottom left */}
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            left: 20,
            zIndex: 20,
            maxWidth: 180,
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Text
            style={{
              fontFamily: 'PixelifySans',
              fontSize: 11,
              color: '#636e72',
            }}
            numberOfLines={expanded ? undefined : 1}
          >
            {formattedDate}
          </Text>
          {location?.address && (
            <Text
              style={{
                fontFamily: 'PixelifySans',
                fontSize: 11,
                color: '#636e72',
              }}
              numberOfLines={expanded ? undefined : 1}
            >
              {location.address}
            </Text>
          )}
        </View>
      </View>

      {/* Layer 3 */}
      <View
        style={{
          width: layer3Width,
          height: layer3Height,
          top: 19,
          position: 'absolute',
          zIndex: 1,
          transitionProperty: 'width, height, top',
          transitionDuration: '300ms',
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
          width: layer4Width,
          height: layer4Height,
          top: layer4Top,
          position: 'absolute',
          zIndex: 1,
          transitionProperty: 'width, height, top',
          transitionDuration: '300ms',
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
            top: 10,
            left: 10,
            right: 10,
            zIndex: 5,
          }}
        >
          {expanded ? renderCarousel() : renderCollage()}
          {/* Title & Body Box */}
          <View
            style={{
              backgroundColor: '#EEEEEE',
              borderRadius: 8,
              borderWidth: 2,
              borderColor: '#888',
              padding: 10,
              marginTop: 10,
              minHeight: 40,
              // Only limit height and hide overflow in collapsed mode
              maxHeight: expanded ? undefined : 60,
              overflow: expanded ? 'visible' : 'hidden',
            }}
          >
            <Text
              style={{
                fontFamily: 'PixelifySans',
                fontWeight: 'bold',
                fontSize: 18,
                color: '#222',
                textAlign: 'left',
                alignSelf: 'flex-start',
              }}
              numberOfLines={expanded ? undefined : 1}
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
              }}
              numberOfLines={expanded ? 2 : 1}
            >
              {body}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default EntryCard;
