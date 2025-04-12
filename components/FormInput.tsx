import { View, Text, TextInput, TextInputProps } from 'react-native';
import React from 'react';

interface FormInputProps extends TextInputProps {
  label: string;
  borderColor?: string;
}

export default function FormInput({
  label,
  borderColor,
  ...props
}: FormInputProps) {
  return (
    <View className="mb-2.5">
      <Text className="text-left mb-2.5">{label}</Text>
      <TextInput
        {...props}
        className="text-base border-2 p-2.5 rounded mb-2.5 text-[#7D7E83]"
        style={[props.style, borderColor ? { borderColor } : {}]}
      />
    </View>
  );
}
