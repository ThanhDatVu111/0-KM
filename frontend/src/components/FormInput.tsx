import { View, Text, TextInput, TextInputProps } from 'react-native';
import React from 'react';

interface FormInputProps extends TextInputProps {
  label?: string;
  borderColor?: string;
}

export default function FormInput({ label, borderColor, ...props }: FormInputProps) {
  return (
    <View className="mb-2.5 w-full">
      {label && (
        <Text
          className="text-left mb-2.5 text-base text-black font-bold"
          style={{ fontFamily: 'Poppins-Regular' }}
        >
          {label}
        </Text>
      )}
      <TextInput
        {...props}
        className="text-base border-2 rounded mb-2.5 text-black bg-[#F3EEFF]"
        style={[
          {
            borderColor: borderColor || '#D1D5DB',
            fontFamily: 'Poppins-Regular',
            minHeight: 48,
            paddingHorizontal: 12,
            paddingVertical: 14, // Increased to prevent cutting
            fontSize: 16,
            lineHeight: 20,
            textAlignVertical: 'center',
            includeFontPadding: false, // Android: removes extra font padding
          },
          props.style,
        ]}
        placeholderTextColor="#A1A1AA"
      />
    </View>
  );
}
