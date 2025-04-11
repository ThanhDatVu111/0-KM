import { Text, View, TouchableOpacity, Image } from 'react-native';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <View className="mt-10">
        <Image
          source={require('../assets/images/logo.png')}
          style={{ width: 150, height: 150 }}
          resizeMode="contain"
        />
      </View>

      <View className="border ">
        <Image
          source={require('../assets/images/polaroid frame.png')}
          style={{ width: 400, height: 400 }}
          resizeMode="contain"
        />
      </View>

      {/* Subtitle */}
      <Text className="text-lg text-[#CF5771] mt-10">
        One journey, two hearts, zero distance
      </Text>

      {/* Button */}
      <TouchableOpacity className="mt-5 bg-accent px-20 py-4 rounded-full">
        <Text className="text-white text-lg font-semibold">Let’s login</Text>
      </TouchableOpacity>
    </View>
  );
}