import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  size?: string; 
  color?: string; 
  className?: string;
  textClassName?: string;
}

export default function Button({
  label,
  size = 'py-3 px-6',
  color = 'bg-accent text-white',
  className = '',
  textClassName = '',
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={`rounded-lg items-center mb-3 ${size} ${color} ${className}`}
      {...props} // this includes onPress, disabled, etc.
    >
      <Text
        className={`text-base ${textClassName}`}
        style={{ fontFamily: 'Poppins-Bold' }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}