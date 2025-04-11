import { Text, View, TouchableOpacity, Image } from 'react-native';
import { Link } from "expo-router";

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
      <Link href="../(auth)/signin">
      <TouchableOpacity className="min-w-[200px] w-72 mx-4 content-center  mt-5 bg-accent px-20 py-4 rounded-full ">
        <Text className="justify-center text-center text-white text-lg font-semibold">
          Let’s login
        </Text>
      </TouchableOpacity>
      </Link>
    </View>
  );
}
