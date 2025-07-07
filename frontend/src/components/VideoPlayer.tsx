import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

export default function VideoPlayer({ uri, style }: { uri: string; style?: any }) {
  const [loading, setLoading] = React.useState(true);

  return (
    <View
      style={[{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }, style]}
    >
      {loading && (
        <ActivityIndicator
          size="large"
          color="#A270E6"
          style={{ position: 'absolute', zIndex: 2 }}
        />
      )}
      <Video
        source={{ uri }}
        style={[{ width: '100%', height: '100%' }, style]}
        useNativeControls
        resizeMode={ResizeMode.COVER}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        shouldPlay={false}
        isLooping={true}
        isMuted={false}
        volume={1.0}
      />
    </View>
  );
}
