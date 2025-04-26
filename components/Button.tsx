import React from 'react';
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  TextStyle,
  Image,
  ImageSourcePropType,
  View,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  size?: string;
  color?: string;
  className?: string;
  textClassName?: string;
  textStyle?: TextStyle;
  imgSrc?: ImageSourcePropType;
}

export default function Button({
  label,
  size = '',
  color = '',
  className = '',
  textClassName = '',
  textStyle,
  imgSrc,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={`rounded-lg items-center mb-3 ${size} ${color} ${className}`}
      {...props} // this includes onPress, disabled, etc.
    >
      <View className="flex-row items-center justify-center w-full">
        {imgSrc && (
          <Image
            source={imgSrc}
            style={{ width: 24, height: 24, marginRight: 8 }}
            resizeMode="contain"
          />
        )}

        <Text
          className={`text-base ${textClassName}`}
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
