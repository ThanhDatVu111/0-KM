import { Text, View, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export default function Index() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
        'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
        'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-primary">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-primary">
      {/* Logo */}
      <View className="mt-10">
        <Image
          source={require('../assets/images/logo.png')}
          style={{ width: 150, height: 150 }}
          resizeMode="contain"
        />
      </View>

      {/* Polaroid */}
      <View className="border">
        <Image
          source={require('../assets/images/polaroid frame.png')} //pr create new branch for polaroid: quyen
          style={{ width: 400, height: 400 }}
          resizeMode="contain"
        />
      </View>

      {/* Subtitle */}
      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 16, color: '#CF5771', marginTop: 10 }}>
        One journey, two hearts, zero distance
      </Text>

      {/* Button */}
      <TouchableOpacity
        onPress={() => router.push('../(auth)/signin')}
        className="min-w-[200px] w-72 mx-4 mt-5 bg-accent px-20 py-4 rounded-full items-center"
      >
        <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: 'white', textAlign: 'center' }}>
          Let’s login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
