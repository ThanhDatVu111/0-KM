import { Text, View, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
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

      {/* polaroid*/}
      <View className="border ">
        <Image
          source={require('../assets/images/polaroid frame.png')} //pr create new branch for polaroid: quyen
          style={{ width: 400, height: 400 }}
          resizeMode="contain"
        />
      </View>

      {/* Subtitle */}
      <Text className="text-lg text-[#CF5771] mt-10">
        One journey, two hearts, zero distance
      </Text>

      {/* Button */}
      <TouchableOpacity
        onPress={() => router.push('../(auth)/signin')}
        className="min-w-[200px] w-72 mx-4 mt-5 bg-accent px-20 py-4 rounded-full items-center"
      >
        <Text className="text-white text-lg font-semibold text-center">
          Let’s login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
