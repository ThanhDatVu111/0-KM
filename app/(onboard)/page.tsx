import { View, Text } from "react-native";
import React from "react";
import { SignOutButton } from "@/components/SignOutButton";

const page = () => {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <Text className="text-lg text-black">onboard page</Text>
      <SignOutButton />
    </View>
  );
};

export default page;