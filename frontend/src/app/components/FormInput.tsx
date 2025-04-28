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
    <View className="mb-2.5 w-full">
      <Text
        className="text-left mb-2.5 text-base text-black"
        style={{ fontFamily: 'Poppins-Regular' }}
      >
        {label}
      </Text>
      <TextInput
        {...props}
        className="text-base border-2 p-2.5 rounded mb-2.5 text-[#7D7E83] bg-transparent"
        style={[
          {
            borderColor: borderColor || '#D1D5DB',
            fontFamily: 'Poppins-Regular',
          },
          props.style,
        ]}
        placeholderTextColor="#A1A1AA"
      />
    </View>
  );
}