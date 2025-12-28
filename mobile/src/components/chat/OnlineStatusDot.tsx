import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/config';

interface OnlineStatusDotProps {
  isOnline: boolean;
  size?: number;
}

export default function OnlineStatusDot({ isOnline, size = 12 }: OnlineStatusDotProps) {
  if (!isOnline) return null;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.dot, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: COLORS.green,
  },
});
