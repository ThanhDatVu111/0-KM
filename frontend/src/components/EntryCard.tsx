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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import icons from '@/constants/icons';
import VideoPlayer from './VideoPlayer';

interface MediaItem {
  uri: string;
  cloudinaryUrl?: string;
  type: 'image' | 'video';
}

interface EntryCardProps {
  title: string;
  body: string;
  createdAt: string;
  media: string[];
  location?: { address: string } | null;
  onDelete: () => void;
  onEdit: () => void;
}

// Helper to map string URLs to MediaItem objects
function mapMediaArray(media: string[]): MediaItem[] {
  return media.map((url) => {
    if (url.match(/\.(mp4|mov|webm)$/)) {
      return { type: 'video', cloudinaryUrl: url, uri: url };
    } else {
      return { type: 'image', cloudinaryUrl: url, uri: url };
    }
  });
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [textHeight, setTextHeight] = useState(0);

  // Carousel state for expanded mode
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Enable layout animation on Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const extraCount = media.length > 5 ? media.length - 5 : 0;

  // Grab up to 5 media items (image or video)
  const mediaItems: MediaItem[] =
    typeof media[0] === 'string'
      ? mapMediaArray(media as string[])
      : (media as unknown as MediaItem[]);
  const item0 = mediaItems[0];
  const item1 = mediaItems[1];
  const item2 = mediaItems[2];
  const item3 = mediaItems[3];
  const item4 = mediaItems[4];

  // Carousel image height (easy to update in one place)
  const CAROUSEL_HEIGHT = 256; // 64 * 4 = 256, matches h-64
  // Carousel width state for paging
  const [carouselWidth, setCarouselWidth] = useState(0);
  // Carousel image loading state (for all images in carousel)
  const [carouselImageLoaded, setCarouselImageLoaded] = useState(media.map(() => false));

  // Single-image view for expanded mode
  const renderCarousel = () => {
    if (!mediaItems.length) {
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
          contentContainerStyle={{ width: carouselWidth * mediaItems.length }}
          style={{ width: '100%', height: CAROUSEL_HEIGHT }}
          scrollEventThrottle={16}
        >
          {mediaItems.map((item, idx) => (
            <View
              key={idx}
              style={{
                width: carouselWidth,
                height: CAROUSEL_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {item.type === 'image' ? (
                <Image
                  source={{ uri: item.cloudinaryUrl || item.uri }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: 'transparent',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                  resizeMode="cover"
                  onLoadEnd={() => {
                    setCarouselImageLoaded((prev) => {
                      const arr = [...prev];
                      arr[idx] = true;
                      return arr;
                    });
                  }}
                />
              ) : (
                <VideoPlayer
                  uri={item.cloudinaryUrl || item.uri}
                  style={{ width: '100%', height: '100%', borderRadius: 12 }}
                />
              )}
              {!carouselImageLoaded[idx] && item.type === 'image' && (
                <ActivityIndicator size="large" color="#A270E6" style={{ position: 'absolute' }} />
              )}
            </View>
          ))}
        </ScrollView>
        {/* Indicator */}
        {mediaItems.length > 1 && (
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
            {mediaItems.map((_, idx) => (
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
  // Helper to render a media item (image or video)
  function renderMediaItem(item: MediaItem | undefined, style: any, key?: number) {
    if (!item) return null;
    const baseStyle = {
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: 12,
      ...style,
    };
    if (item.type === 'image') {
      return (
        <Image
          key={key}
          source={{ uri: item.cloudinaryUrl || item.uri }}
          style={baseStyle}
          resizeMode="cover"
        />
      );
    }
    if (item.type === 'video') {
      return <VideoPlayer key={key} uri={item.cloudinaryUrl || item.uri} style={baseStyle} />;
    }
    return null;
  }

  const renderCollage = () => {
    const collageContainerStyle = { height: COLLAGE_HEIGHT };
    const itemStyle = { borderRadius: 12 };
    switch (mediaItems.length) {
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
      case 1:
        return (
          <View style={collageContainerStyle}>
            {renderMediaItem(item0, { ...itemStyle, width: '100%', height: '100%' })}
          </View>
        );
      case 2:
        return (
          <View style={[collageContainerStyle, { flexDirection: 'row' }]}>
            {[item0, item1].map((item, idx) =>
              renderMediaItem(item, { ...itemStyle, width: '50%', height: '100%' }, idx),
            )}
          </View>
        );
      case 3:
        return (
          <View style={[collageContainerStyle, { flexDirection: 'row' }]}>
            {renderMediaItem(item0, { ...itemStyle, width: '50%', height: '100%' })}
            <View style={{ width: '50%', height: '100%' }}>
              {[item1, item2].map((item, idx) =>
                renderMediaItem(item, { ...itemStyle, width: '100%', height: '50%' }, idx),
              )}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={[collageContainerStyle, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {[item0, item1, item2, item3].map((item, idx) =>
              renderMediaItem(item, { ...itemStyle, width: '50%', height: '50%' }, idx),
            )}
          </View>
        );
      default:
        return (
          <View style={[collageContainerStyle, { flexDirection: 'row' }]}>
            {renderMediaItem(item0, { ...itemStyle, width: '50%', height: '100%' })}
            <View
              style={{
                width: '50%',
                height: '100%',
                flexDirection: 'row',
                flexWrap: 'wrap',
                position: 'relative',
              }}
            >
              {[item1, item2, item3, item4].map((item, idx) =>
                renderMediaItem(item, { ...itemStyle, width: '50%', height: '50%' }, idx),
              )}
            </View>
          </View>
        );
    }
  };

  // Calculate expanded size
  const cardWidth = 365;
  const cardHeight = expanded ? 450 + textHeight : 335;
  const layer1Width = 345;
  const layer1Height = expanded ? 450 + textHeight : 335;
  const layer2Width = 365;
  const layer2Height = expanded ? 440 + textHeight : 325;
  const layer3Width = 330;
  const layer3Height = expanded ? 360 + textHeight : 255;
  const layer4Width = 310;
  const layer4Height = expanded ? 335 + textHeight : 230;
  const layer4Top = 32;

  return (
    <View
      style={{
        width: cardWidth,
        height: cardHeight,
        alignSelf: 'center',
        marginBottom: 20,
        position: 'relative',
        alignItems: 'center',
        transitionProperty: 'height',
        transitionDuration: '300ms',
      }}
    >
      {/* Layer 1 */}
      <View
        style={{
          width: layer1Width,
          height: layer1Height,
          backgroundColor: '#F24187',
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 3,
          borderRadius: 10,
          borderColor: '#220E6D',
          borderWidth: 3,
          position: 'absolute',
        }}
      />

      {/* Layer 2 */}
      <View
        style={{
          width: layer2Width,
          height: layer2Height,
          backgroundColor: '#FDA3D4',
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 3,
          borderRadius: 10,
          borderColor: '#220E6D',
          borderWidth: 3,
          position: 'absolute',
        }}
      >
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
            onPress={() => setShowDeleteModal(true)}
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
          backgroundColor: '#A673E7',
          borderRadius: 10,
          borderColor: '#220E6D',
          borderWidth: 3,
          position: 'absolute',
        }}
      ></View>

      {/* Layer 4 */}
      <View
        style={{
          width: layer4Width,
          height: layer4Height,
          top: layer4Top,
          position: 'absolute',
          backgroundColor: '#F8EAF8',
          borderRadius: 10,
        }}
      >
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
              }}
              onLayout={(event) => setTextHeight(event.nativeEvent.layout.height)}
              numberOfLines={expanded ? undefined : 1}
            >
              {body}
            </Text>
          </View>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        >
          <View
            style={{
              width: '80%',
              backgroundColor: '#FFF0F5',
              borderWidth: 4,
              borderColor: '#000',
              shadowColor: '#000',
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 0.5,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomWidth: 2,
                borderColor: '#000',
                backgroundColor: '#FAD3E4',
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <View style={{ width: 20 }} />
              <Text style={{ fontFamily: 'PixelifySans', fontSize: 18 }}>DELETE ENTRY</Text>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                activeOpacity={0.8}
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#FFE4EC',
                  borderColor: '#000',
                  borderWidth: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 18,
                    color: '#000',
                    lineHeight: 20,
                  }}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>
            {/* Body */}
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: 'PixelifySans',
                  fontSize: 16,
                  color: '#222',
                  textAlign: 'center',
                }}
              >
                Are you sure you want to delete this entry? This action cannot be undone.
              </Text>
            </View>
            {/* Actions */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderTopWidth: 2,
                borderColor: '#000',
              }}
            >
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  backgroundColor: '#EEE',
                  borderRightWidth: 2,
                  borderColor: '#000',
                }}
              >
                <Text style={{ fontFamily: 'PixelifySans', fontSize: 15, color: '#222' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  onDelete();
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  backgroundColor: '#FAD3E4',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PixelifySans',
                    fontSize: 15,
                    color: '#d63031',
                    fontWeight: 'bold',
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EntryCard;
