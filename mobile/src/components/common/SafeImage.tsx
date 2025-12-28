import React from 'react';
import { Image, ImageProps, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';

interface SafeImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackIconSize?: number;
}

export default function SafeImage({
  uri,
  style,
  fallbackIcon = 'person',
  fallbackIconSize = 40,
  ...props
}: SafeImageProps) {
  // Check if URI is valid
  const isValidUri = uri && uri.trim() !== '';

  if (!isValidUri) {
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons name={fallbackIcon} size={fallbackIconSize} color={COLORS.gray400} />
      </View>
    );
  }

  return <Image source={{ uri }} style={style} {...props} />;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
